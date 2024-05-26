import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import lightLogo from "../imgs/logo-light.png";
import darkLogo from "../imgs/logo-dark.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png"
import lightBanner from "../imgs/blog banner light.png";
import darkBanner from "../imgs/blog banner dark.png";
import toast from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import axios from "axios";
import { ThemeContext, UserContext } from "../App";


import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../common/firebase'; // adjust the path as per your file structure

const BlogEditor = () => {
  

  let blogBannerRef = useRef();
  let {
    blog,
    blog: { title, banner, content, tags, des },
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let { theme, setTheme } = useContext(ThemeContext)

  let { blog_id } = useParams();

  let navigate = useNavigate();

  //useeffect
  // useEffect(() => {
  //     let editor = new EditorJS({
  //         holderId: "textEditor",
  //         data: '',
  //         placeholder: "Let's write a awesome story"
  //     })
  // }, [])
 //const editorInitialized = useRef(false);

//   useEffect(() => {
//     if (!textEditor.isReady && content && content[0] && content[0].blocks) {
//       setTextEditor(
//         new EditorJS({
//           // holderId: "textEditor",
//           holder: "textEditor",
//           data: Array.isArray(content) ? content[0] : content, // Using optional chaining
//           tools: tools,
//           placeholder: "Let's write an awesome story",
//         })
//       );
//     }
//   }, []);
  
//   useEffect(() => {
//     if (!textEditor.isReady) {
//       setTextEditor(
//         new EditorJS({
//           // holderId: "textEditor",
//           holder: "textEditor",
//           data: Array.isArray(content) ? content[0] : content,
//           tools: tools,
//           placeholder: "Let's write an awesome story",
//         })
//       );
//     }
//   }, []);

//   useEffect(() => { main code
    
//       if (!editorInitialized.current) {
//           const editorInstance = new EditorJS({
//               holder: "textEditor",
//               // data: '',
//               data: Array.isArray(content) ? content[0] : content,
//               tools: tools,
//               placeholder: "Let's write an awesome story",
//               onReady: () => {
//                   setTextEditor(editorInstance);
//               }
//           });
//           editorInitialized.current = true;
//       }

//   }, []);

const [editorInitialized, setEditorInitialized] = useState(false);

useEffect(() => {
    console.log("Initializing EditorJS...");
    if (!editorInitialized) {
      const editorInstance = new EditorJS({
        holder: "textEditor",
        data: Array.isArray(content) ? content[0] : content,
        tools: tools,
        placeholder: "Let's write an awesome story",
        onReady: () => {
          console.log("EditorJS Ready!");
          setTextEditor(editorInstance);
        }
      });
      setEditorInitialized(true);
    }
  }, [editorInitialized, content]);
  

 

  // const handleBannerUpload = (e) => {
  //   //console.log(e);
  //   let img = e.target.files[0];

  //   if (img) {
  //     let loadingToast = toast.loading("Uploading...");

  //     uploadImage(img)
  //       .then((url) => {
  //         if (url) {
  //           toast.dismiss(loadingToast);
  //           toast.success("Uploaded wow!");
  //           //blogBannerRef.current.src = url;

  //           setBlog({ ...blog, banner: url });
  //         }
  //       })
  //       .catch((err) => {
  //         toast.dismiss(loadingToast);
  //         return toast.error(err);
  //       });
  //   }

  //   // console.log(img)
  // };

  const handleBannerUpload = (e) => {
    let img = e.target.files[0];
  
    if (img) {
      let loadingToast = toast.loading("Uploading...");
  
      const storageRef = ref(storage, `images/${img.name}`);
      const uploadTask = uploadBytes(storageRef, img);
  
      uploadTask
        .then((snapshot) => {
          toast.dismiss(loadingToast);
          toast.success("Image uploaded successfully");
  
          // Get the download URL for the image
          getDownloadURL(snapshot.ref).then((url) => {
            setBlog({ ...blog, banner: url });
            console.log(url);
            blogBannerRef.current.src = url;
          });
        })
        .catch((error) => {
          toast.dismiss(loadingToast);
          toast.error(`Failed to upload image: ${error.message}`);
        });
    }
  };

  const handleTitleKeyDown = (e) => {
    //console.log(e);
    if (e.keyCode == 13) {
      // enter key
      e.preventDefault();
    }
  };

  const handleTitleChange = (e) => {
    //console.log(e);
    let input = e.target;

    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
    ``;
    setBlog({ ...blog, title: input.value });
  };

  const handleError = (e) => {
    let img = e.target;

    img.src = defaultBanner;
    // img.src = theme == "light" ? darkBanner : lightBanner;
    console.log(e);
  };

  const handlePublishEvent = () => {
    //uncomment when u add imageupload by firebase

    // if(!banner.length && banner){
    //     return toast.error("Upload blog banner to publish it!")
    // }

    if (!title || typeof title !== "string" || !title.length) {
      return toast.error("Write blog title to publish it");
    }

    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          // console.log(data)
          if (data.blocks.length) {
            setBlog({ ...blog, content: data });
            setEditorState("publish");
          } else {
            return toast.error("write something in your blog to publish it");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }

    if (title && !title.length) {
      toast.error("Write blog title before saving it as blog");
    }

    let loadingToast = toast.loading("Saving Draft....");

    e.target.classList.add("disable");

    if (textEditor.isReady) {
      textEditor.save().then((content) => {
        let blogObj = {
          title,
          banner,
          des,
          tags,
          content,
          draft: true,
          //give draft true cuz if its false it will consider it as saving in db
        };

        axios
          .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", { ...blogObj, id: blog_id }, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          })
          .then(() => {
            e.target.classList.remove("disable");

            toast.dismiss(loadingToast);
            toast.success("Saved ");

            setTimeout(() => {
              navigate("/dashboard/blogs?tab=draft"); //gonna change when dashboard iscretaed (edited) changed
            }, 500);
          })
          .catch(({ response }) => {
            e.target.clasList.remove("disable");
            toast.dismiss(loadingToast);

            return toast.error(response.data.error);
          });
      });
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={theme == "light" ? darkLogo : lightLogo} alt="" />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title && title.length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Publish
          </button>
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            {/* //aspect ratio : 16::9 */}
            <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
              {/* if u click on label the dialogue box will open */}
              <label htmlFor="uploadBanner">
                <img
                  ref={blogBannerRef}
                  src={defaultBanner} //change to banner imp!
                  // src={theme == "light" ? darkBanner : lightBanner} //change to banner imp!
                  className="z-20 object-fill" //its will be over the input
                  onError={handleError}
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                ></input>
              </label>
            </div>

            <textarea
              defaultValue={title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5" />

            <div id="textEditor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
