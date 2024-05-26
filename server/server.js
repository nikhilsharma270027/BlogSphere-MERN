import express from "express"
import mongoose  from "mongoose";
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from "nanoid";
import jwt from 'jsonwebtoken';//2:39:40
//const { verify } = jwt;
import cors from 'cors';//3:20
//firebase
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth"
//Schema below
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import serviceAccountKey from "./reactjs-blog-89191-firebase-adminsdk-xwy3w-2d1f348cca.json" assert { type: "json" };
import Notification from "./Schema/Notification.js";
import Comment from "./Schema/Comment.js";
// import { populate } from "dotenv";
// import { fetchComments } from "../blogging website - frontend/src/components/comments.component.jsx";
//AWS
// import aws from "aws-sdk"

const DB_LOCATION="mongodb+srv://admin:nikhil27damn@reactjs-blog-db.o2qvesd.mongodb.net/?retryWrites=true&w=majority&appName=reactjs-blog-db";

const server = express();
let PORT = 3000;


admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey)
});
// noew our admin is connected to firebase project

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json())
server.use(cors())//enables server to accept data from anywhere
mongoose.connect(DB_LOCATION, {
    autoIndex: true
});
//send one these three data to frontend view / 

const generateUploadURL = async () => {
    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

    const ref = storage.ref(imageName);
    const uploadURL = await ref.getDownloadURL();

    return uploadURL;
}

//

const verifyJWT = (req, res, next) => {

    const authHeader = req.header("authorization");
    //authorization header value
    const token = authHeader && authHeader.split(" ")[1]; //[ 'Bearer, ]

    if(token == null) {
        return res.status(401).json({ error: "No access Token" })
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if(err){
            return res.status(403).json({ error: "Access token is invalid" })
        }

        req.user = user.id // storing bcuz to know this is the user who is requesting service or routee 
        next();
    })
}

const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY)

    return {
        access_token: access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    }
}

const generateUsername = async (email)=> {
    let username = email.split("@")[0];

    let isUsernameNotunique = await User.exists({ "personal_info.username": username }).catch((result) => result)

    isUsernameNotunique ? username +=  nanoid().substring(0,5) : "";
    return username

}


server.get('/get-upload-url', (req, res) => {
    generateUploadURL()
    .then(url => {
        res.status(200).json({ uploadURL: url });
    })
    .catch(err => {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    });
});

//

server.post('/signup', (req, res) => {
    console.log(req.body)
    // res.json(req.body)
    let { fullname, email, password } = req.body;

    if(fullname.length < 3) {
        return res.status(403).json({ "error": "Fullname must be at least 3 letters long" })
    }
    if(!email.length) {
        return res.status(403).json({ "error": "Enter email" })
    }
    if(!emailRegex.test(email)) {
        return res.status(403).json({ "error" : "Email is invalid" })
    }
    if(!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be 6 to 20 characters long with a numeric, 1 uppercase & 1 lowercase " })
    }
    //( string, 10(salting), function if any error occurs )
    // 10 means how much complex i want the hashedpassword to be
    bcrypt.hash(password, 10, async ( err, hased_password ) => {

        let username = await generateUsername(email ); //'as@gmail.com' -> [as, gmail] -> as

        let user = new User({
            personal_info: { fullname, email, password: hased_password, username }
        })
        user.save().then((u)=> {//mongodb save method to save schema/userinfo
            return res.status(200).json(formatDatatoSend(u))
        })
        .catch(err => {
            if(err.code === 11000){
                return res.status(500).json({ "error":"Email already exist" })
            }
            return res.status(500).json({ "error": err.message })
        })
        console.log(hased_password);
    })

        //return res.status(200).json({ "status": "okay" })
})

server.post('/signin', (req,res) => {
    let { email, password } = req.body;

    User.findOne({ "personal_info.email": email })
    .then((user) => {
        if(!user) {
            return res.status(403).json({ 'error': "Email not found" });
        }
        if(!user.google_auth){

            bcrypt.compare(password, user.personal_info.password, (err, result)=> {
                if(err){
                    return res.status(403).json({ "error": "Error occured while login please try again!" })
                }
    
                if(!result) {
                    return res.status(403).json({ "error": "Incorrect password" })
                } else {
                    return res.status(200).json(formatDatatoSend(user))
                }
            })
        } else {
            return res.status(403).json({ "error": "Account was created using google. Try logging in with google" })
        }


        //console.log(user);
        //return res.json({ "status": "got user document" })
    })
    .catch(err => {
        console.log(err.message);
        return res.status(403).json({ "error": err.message })
    })
})


//google auth
//async is to verify wheater the access_token verified
server.post("/google-auth", async (req,res) => {

    let { access_token } = req.body;
    
    getAuth().verifyIdToken(access_token)
    .then(async(decodedUser) => {

        let { email, name, picture } = decodedUser;

        picture = picture.replace("s96-c", "s384-c")
        //codes are to display highresolution profile

        let user = await User.findOne({ "personal_info": email }).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
            return u || null
        })
        .catch(err => {
            return res.status(500).json({ "error": err.message })
    })
        //checked wheere google auth is true/false
        if(user) {//login
            if(!user.google_auth){
                return res.status(403).json({ "error": "This email was signed up without google. Please log in with password to access the account" })
            }
        }
        else  {//sign up block

            let username = await generateUsername(email);

            user = new User({
                personal_info: { fullname: name, email, username },
                google_auth: true
            })

            await user.save().then((u) => { //saving user in database
                user = u
            })
            .catch(err => {
                return res.status(500).json({ "error": err.message })
            })
        }

        return res.status(200).json(formatDatatoSend(user))

    })
    .catch(err => {
        return res.status(500).json({ "error": "Failed to authenicate you with google, Try with dome other google account" })
    })
    //.verfiyIDtoken will verify the access_token

})

server.post("/change-password", verifyJWT, (req, res) => {

    let { currentPassword, newPassword } = req.body;

    if(!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)){
        return res.status(403).json({error :"Password should be 6 to 20 characters long with a numeric, 1 uppercase & 1 lowercase letters"})
    }

    User.findOne({ _id: req.user })
    .then((user) => {

        if(user.google_auth){
            return res.status(403).json({error: "You can't change account;'s password because you logged in through google"})
        }

        bcrypt.compare(currentPassword, user.personal_info.password, (err, result) => {
            if(err){
                return res.status(500).json({ error:"Some error occured while changing athe password, please try again later" })
            }

            if(!result){
                return res.status(403).json({ error:"Incorrect current password" })
            }

            bcrypt.hash(newPassword, 10, (err, hashed_password) => {

                User.findOneAndUpdate({ _id: req.user}, { "personal_info.password": hashed_password})
                .then((u) => {
                    return res.status(200).json({ status: "Password changed"})
                })
                .catch(err => {
                    return res.status(500).json({ error: "Some error occured while saving new password, please try again later" })
                })
            })
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ error: "User not" })
    })
})

server.post('/latest-blogs', (req,res) => {

    let { page } = req.body;

    let maxLimit = 5;

    Blog.find({ draft: false })
    .populate("author"," personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })//-1 means give me recent
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)//if i have 10 items it will start from 6th skipping first 5
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => { 
        return res.status(500).json({ error: err.message })
     })
})

server.post("/all-latest-blogs-count", (req, res) => {

    Blog.countDocuments({ draft: false })
    .then(count => {
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        console.log(err.message)
        return res.status(500).json({ error: err.message })
    })
})

server.get("/trending-blogs", (req, res) => {

    Blog.find({ draft: false })
    .populate("author"," personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
    .select("blog_id title publishedAt -_id")
    .limit(5)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => { 
        return res.status(500).json({ error: err.message })
     })
})

//search page for both searching blog and Users
server.post('/search-blogs', (req,res) => {

    // let { tag } = req.body;
    // let { tag, page } = req.body;3:26kb
    let { tag, query, page, author,limit, eliminate_blog} = req.body;

    let findQuery;

    if(tag){
        findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
    } else if(query){
        findQuery = { draft: false, title: new RegExp(query, 'i') } //"how to drbug js"->debug, js
    } else if (author){
        findQuery = { author, draft: false }
    }

    //if we mention limit in frontend or it'll be 0
    let maxLimit = limit ? limit : 2;

    Blog.find(findQuery)
    .populate("author"," personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })//-1 means give me recent
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => { 
        return res.status(500).json({ error: err.message })
     })

})

server.post("/search-blogs-count", (req, res) => {

    let { tag, author, query } = req.body;

    // let findQuery = { tags: tag, draft: false};
    let findQuery;

    if(tag){
        findQuery = { tags: tag, draft: false };
    } else if(query){
        findQuery = { draft: false, title: new RegExp(query, 'i') } //"how to drbug js"->debug, js
    } else if (author){
        findQuery = { author, draft: false }
    }

    Blog.countDocuments(findQuery)
    .then(count => {
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        console.loglog(err);
        return res.status(500).json({ error: err.message })
    })
})

server.post("/search-users", (req, res) => {

    let { query } = req.body;

    User.find({"personal_info.username": new RegExp(query,'i')})
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img")
    .then(users => {
        return res.status(200).json({ users })
    })
    .catch(err => {
        return res.status(500).json({ error:err.message })
    })
})

server.post("/get-profile", (req, res) => {

    let { username } = req.body

    User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updatedAt -blogs ")
    .then(user => {
        return  res.status(200).json(user);
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

//update profile image
server.post("/update-profile-img", verifyJWT, (req, res) => {

    let { url } = req.body;

    User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url})
    .then(() => {
        return res.status(200).json({ profile_img: url })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

server.post("/update-profile", verifyJWT, (req, res ) => {
    let bioLimit = 150;
    let { username, bio, social_links } = req.body;

    if(!username.length > 3){
        res.status(403).json({ error: "Username should be more than 3 letters long"})
    }
    if(bio.length > bioLimit){
        res.status(403).json({ error: `Bio should not be more than ${bioLimit}` })
    }

    let sociallinksArr = Object.keys(social_links);
    try{

        for(let i=0; i< sociallinksArr.length; i++){
            if(social_links[sociallinksArr[i]].length){
                let hostname = new URL(social_links[sociallinksArr[i]]).hostname;
                //https://youtube.com 
                if(!hostname.includes(`${sociallinksArr[i]}.com`) && sociallinksArr[i] != 'website'){
                    return res.status(403).json({ error: `${sociallinksArr[i]} link is invalid. You must enter a full website link.`})
                }
            }
        }
    } catch (err) {
        return res.status(500).json({ error: "You must provide full social links with http(s) included"})
    }

    let UpdateObj = {
        "personal_info.username": username,
        "personal_info.bio": bio,
        social_links

    }

    User.findOneAndUpdate({ _id: req.user }, UpdateObj, {
        runValidators: true
    })
    .then(() => {
        return res.status(200).json({ username })
    })
    .catch(err => {
        if(err.code == 11000){
            return res.status(500).json({ error: err.message })
            
        }
        return res.status(500).json({ error: err.message })
    })
})

server.post("/create-blog",  verifyJWT, (req, res) => {

    //retriving author id
    let authorId = req.user; //taking from verifyJWT
    
    let { title, des, banner, tags, content, draft, id } = req.body;
    
    if(!title && title.length) {
        return res.status(403).json({ error: "You must provide a title to publish the blog" })
    }
    
    if(!draft){
        if(des && !des.length || des.length > 200) {
        return res.status(403).json({ error: "You must provide blog description under 200 characters" })
    }

    if(banner && !banner.length ) {
        return res.status(403).json({ error: "You must provide banner to publish it" })
    }

    if(!content || !content.blocks || !content.blocks.length) {
        return res.status(403).json({ error: "Ther must be soome blog content to publish it." })
    }

    if(tags && !tags.length || tags.length > 10) {
        return res.status(403).json({ error: "Provide tags to publish , aleast 10" })
    }
    }


    
    // tech , Tech, TECH
    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = id || title.replace(/[^a-zA-Z0-9]/g, '').replace(/|s+/g, "-").trim() + nanoid();
    console.log(blog_id)

    if(id) { //editor blog code

        Blog.findOneAndUpdate({ blog_id }, { title, des, banner, content, tags, draft: draft ? draft : false })
        .then(() => {
            return res.status(200).json({ _id: blog_id })
        })
        .catch(err => {
            return res.status(500).json({ error: "Failed to update total_posts number" })
        })
    } else {

        let blog = new Blog({
            title, 
            des, 
            banner, 
            content, 
            tags, 
            author: authorId, 
            blog_id, 
            draft: Boolean(draft)
        })
    
        blog.save().then(blog => {
    
            let incrementVal = draft ? 0 :1;
    
            User.findOneAndUpdate({ _id: authorId },{ $inc : { "account_info.total_posts" : incrementVal }, $push : { "blogs": blog._id } })
            .then(user => {
                return res.status(200).json({ _id: blog.blog_id })
            })
            .catch(err => {
                console.log(err)
                return res.status(500).json({ error: "Failed to update total_posts number" })
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })

    }

    //return res.json({ status: "done" })

    // return res.json(req.body)
})

server.post("/get-blog", (req, res) => {

    // let { blog_id } = req.body;
    let { blog_id, draft, mode } = req.body;

    let incrementVal = mode != 'edit' ? 1 : 0;

    Blog.findOneAndUpdate({ blog_id: blog_id }, { $inc : { "activity.total_reads": incrementVal }})
    .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
    .select("title des content banner activity publishedAt blog_id tags")
    .then(blog => {

        User.findOneAndUpdate({ "personal_info.username": blog.author.personal_info.username }, {
            $inc : { "account_info.total_reads": incrementVal }
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
            if(blog.draft && !draft){
                return res.status(500).json({ error:'you can not access draft blogs.' })
            }

        return res.status(200).json({ blog })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

//like server
server.post("/like-blog", verifyJWT , (req,res) => {

    let user_id = req.user;

    let { _id, islikedByUser } = req.body;

    let incrementVal = !islikedByUser ? 1 : -1;

    Blog.findOneAndUpdate({ _id }, { $inc : { "activity.total_likes": incrementVal } })
    .then(blog => {

        if(!islikedByUser){
            let like = new Notification({
                type: "like",
                blog: _id,
                notification_for: blog.author,
                user: user_id
            })

            like.save().then(notification => {
                return res.status(200).json({ liked_by_user: true })
            })
        } else { //it is receiver data of liked from db but the doc will be there for a long time so we have to delette it when disliked

            Notification.findOneAndDelete({ user: user_id, blog: _id, type: "like" })
            .then(data => {
                return res.status(200).json({ liked_by_user: false })
            })
            .catch(err => {
                return res.status(500).json({ error: err.message })
            })

        }
    })
})

//like info 
server.post("/isliked-by-user", verifyJWT, (req,res) => {

    let user_id = req.user;

    let { _id } = req.body;

    Notification.exists({ user: user_id, type: "like", blog: _id })
    .then(result => {
        return res.status(200).json({result})
        //on frontend wee'll get an object as ({result}) => {result: true} or vise versa
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

//comment route
server.post("/add-comment", verifyJWT, (req, res) => {

    let user_id = req.user;
    console.log(req.body)
    let { _id, comment,  blog_author, replying_to, notification_id} = req.body;

    if(!comment.length){
        return res.status(403).json({ error: "Write something to leave a comment" })
    }

    //creating a comment doc
    let commentObj = {
        blog_id: _id, 
        blog_author, 
        comment, 
        commented_by: user_id, 

    }

    if(replying_to){
        commentObj.parent = replying_to;
        commentObj.isReply = true;
    }

     new Comment(commentObj).save().then(async commentFile => {
        
        let { comment, commentedAt, children} = commentFile;

        Blog.findOneAndUpdate({ _id }, { $push: { "comments": commentFile._id }, $inc: { "activity.total_comments": 1 , "activity.total_parent_comments": replying_to ? 0 : 1 }, })
        .then(blog => {console.log('new comment is created');});

        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentFile._id
        }

        if(replying_to) {

            notificationObj.replyied_on_comment = replying_to;

            await Comment.findOneAndUpdate({ _id: replying_to }, { $push: { children: commentFile._id }})
            .then(replyingToCommentDoc => { notificationObj.notification_for = replyingToCommentDoc.commented_by })

            if(notification_id){
                Notification.findOneAndUpdate({ _id: notification_id }, { reply: commentFile.id })
                .then(notification => console.log("notif updated"))
            }
        }

        new Notification(notificationObj).save().then(notification => console.log('new notification created'))
            return res.status(200).json({
                comment, commentedAt, _id: commentFile._id, user_id, children 
            })
        
    })
})

server.post("/get-blog-comments", (req,res) => {

    let { blog_id, skip} = req.body;

    let maxLimit = 5;

    Comment.find({ blog_id, isReply: false })
    .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img" )
    .skip(skip)
    .limit(maxLimit)
    .sort({
        'commentedAt': -1
    })
    .then(comment => {
        return res.status(200).json(comment)
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })
})

//replies route
server.post('/get-replies', (req, res) => {
    
    let { _id, skip} = req.body

    let maxLimit = 5;

    Comment.findOne({ _id })
    .populate({
        path: "children",
        options: {
            limit: maxLimit,
            skip: skip,
            sort: { 'commentedAt': -1 }
        },
        populate: {
            path: 'commented_by',
            select: "personal_info.profile_img personal_info.fullname personal_info.username"
        },
        select: "-blog_id -updatedAt"
    })
    .select("children")
    .then(doc => {
        return res.status(200).json({ replies: doc.children })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
}) 

const fetchComments = async ({ skip = 0, blog_id, setParentCommentCountFun, comment_array = null }) => {
  try {
    const response = await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog-comments", { blog_id, skip });
    const data = response.data;
    
    if (data) {
      data.map(comment => {
        comment.childrenLevel = 0;
      });
  
      setParentCommentCountFun(prevCount => prevCount + data.length);
  
      const results = comment_array ? [...comment_array, ...data] : data;
      return { results };
    } else {
      throw new Error("Data is undefined");
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    return { results: [] }; // Return empty array or handle error as per your requirement
  }
};

//delete comment
const deleteComment = ( _id ) => {
    Comment.findOneAndDelete({ _id })
    .then(comment => {
        //basic what we are ckecking is the comment has parent key ,if the 
        //comment has parent key then it is reply, so in that case i have to 
        //remove thos comment from the array of the parent doc 
        if(comment.parent) {
            Comment.findOneAndUpdate({ _id: comment.parent }, { $pull: { children: _id} })
            .then(data => console.log('comment delete from parent'))
            .catch(err => console.log(err))
        }

        Notification.findOneAndDelete({ comment: _id }).then(notification => console.log('comment notification deleted'))

        Notification.findOneAndUpdate({ reply: _id }, { $unset: { reply: 1 }}).then(notification => console.log('reply notification deleted'))

        Blog.findOneAndUpdate({ _id: fetchComment.blog_id }, { $pull: { comments: _id }, $inc: { "activity.total_comments": -1 }, "activity.total_parent_comments": comment.parent ? 0 : -1})
        .then(blog => {
            if(comment.children.length){
                comment.children.map(replies => { 
                    deleteComment(replies) //recursion delete
                })
            }
        })
    })
    .catch(err => {
        console.log(err.message);
    })
}

server.post("/delete-comment", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { _id } = req.body;

    Comment.findOne({ _id })
    .then(comment => {

        if( user_id == comment.commented_by || user_id == comment.blog_author){

            deleteComment(_id)

            return res.status(200).json({ status: 'done' })
        } else {

            return res.status(403).json({ error: "You can not delete this comment" })
        }
    })
})

server.get("/new-notification", verifyJWT, (req, res) => {

    let user_id = req.user;

    Notification.exists({ notification_for: user_id, seen:false, user: { $ne: user_id} })
    .then(result => {
        if(result){
            return res.status(200).json({ new_notification_available: true })
        } else {
            return res.status(200).json({ new_notification_available: false })
        }
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })
})

server.post("/notifications", verifyJWT, (req, res) => {
    let user_id = req.user;

    let { page, filter, deletedDocCount } = req.body;

    let maxLimit = 10;

    let findQuery = { notification_for: user_id, user: { $ne: user_id }}

    let skipDocs = ( page - 1 ) * maxLimit;

    if(filter != 'all'){
        findQuery.type = filter;
    }

    if(deletedDocCount){
        skipDocs -= deletedDocCount;
    }

    Notification.find(findQuery)
    .skip(skipDocs)
    .limit(maxLimit)
    .populate("blog", "title blog_id")
    .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
    .populate("comment", "comment")
    .populate("replied_on_comment", "comment")
    .populate("reply", "comment")
    .sort({ createdAt: -1 })
    .select("createdAt type seen reply")
    .then(notifications => {

    Notification.updateMany(findQuery, { seen: true })
    .skip(skipDocs)
    .limit(maxLimit)
    .then(() => console.log("notification seen"))


        return res.status(200).json({ notifications })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

server.post("/all-notifications-count", verifyJWT, (req, res) => {
    let user_id = req.user;

    let { filter } = req.body;

    let findQuery = { notification_for: user_id, user: { $ne: user_id} }

    if(filter != 'all'){
        findQuery.type = filter;
    }

    Notification.countDocuments(findQuery)
    .then(count => {
        return res.status(200).json({ totalDocs: count})
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

server.post("/user-written-blogs", verifyJWT, (req, res) => {

    let user_id = req.user;

    let {page, draft, query, deletedDocCount } = req.body;

    let maxLimit = 5;
    let skipDocs = (page - 1) * maxLimit;

if(deletedDocCount){
    skipDocs -= deletedDocCount
    }

    Blog.find({ author: user_id, draft, title: new RegExp(query, 'i') })
    .skip(skipDocs)
    .limit(maxLimit)
    .sort({ publishedAt: -1 })
    .select(" title banner publishedAt blogs_id activity des draft -_id ")
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

server.post("/user-written-blogs-count", verifyJWT, (req,res) => {

    let user_id = req.user;

    let { draft, query} = req.body;

    Blog.countDocuments({ author: user_id, draft, title: new RegExp(query, 'i') })
    .then(count => {
        return res.status(200).json({ totalDocs: count})
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })
})

server.post("/delete-blog", verifyJWT, (req, res) => {

    let user_id = req.user;
    let { blog_id } = req.body;

    Blog.findOneAndDelete({ blog_id})
    .then(blog => {

        Notification.deleteMany({ blog: blog._id}).then(data => console.log('notification deleted'))

        Comment.deleteMany({ blog_id: blog._id}).then(data => console.log('comments deleted'))

        User.findOneAndUpdate({ _id: user_id}, {$pull: { blog: blog._id }, $inc: { "account_info.total_posts": blog.draft ? 0 : -1}}).then(user => console.log('blog deleted'))

        return res.status(200).json({ status: 'done' })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

server.listen(PORT, () => {
    console.log("listening on port ->" + PORT);
})