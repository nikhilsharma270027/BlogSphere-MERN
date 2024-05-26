import React, { useContext } from 'react'
import AnimationWrapper from "../common/page-animation"
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages"
import Tag from './tags.component';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../App';

const PublishForm = () => {

  let characterLimit = 200;
  let tagLimit = 10;

  let { blog_id } = useParams();

  let { blog, blog: { banner, title, tags, des, content }, setEditorState, setBlog } = useContext(EditorContext)

  let { userAuth : {access_token  } } = useContext(UserContext);

  let navigate =  useNavigate();

  const handleCloseEvent = () => {
    setEditorState("editor")
  }

  const handleBlogTitleChange = (e) => {
      let input = e.target;

      setBlog({ ...blog, title: input.value })
  }

  // const handleBlogDescriptionChange = (e) => {
  //     let input = e.target;

  //     setBlog({ ...blog, des: input.value })
  // }
  const handleBlogDescriptionChange = (e) => {
    let input = e.target;
    let description = input.value || ''; // Set a default value if input.value is undefined
    setBlog({ ...blog, des: description });
}

const handleTitleKeyDown = (e) => {
  //console.log(e);
  if(e.keyCode == 13){ // enter key
      e.preventDefault();
  }
}

const handleKeyDown = (e) => {
  if (e.keyCode === 13 || e.keyCode === 188) {
    e.preventDefault();
    
    const tag = e.target.value.trim();
    console.log('Tag entered:', tag);

    if (tags && tags.length < tagLimit) {
      if (!tags.includes(tag) && tag.length) {
        console.log('Adding tag:', tag);
        setBlog({ ...blog, tags: [...tags, tag] });
      }
    } else {
      toast.error(`You can add max ${tagLimit} tags`);
    }

    e.target.value = "";
  }
}


const publishBlog = (e) => {

    if(e.target.className.includes("disable")){
      return 
    }

    if(title && !title.length) {
        toast.error("Write blog title before publishing")
    }

    if(des || !des.length || des.length > characterLimit) {
        toast.error(`Write a description about your blog withing ${characterLimit}`)
    }

    if(tags && !tags.length ) {
        toast.error("Enter at least 1 tag to help us rank your blog!")
    }

    let loadingToast = toast.loading("Publishing....");

    e.target.classList.add("disable");

    let blogObj = {
      title, banner, des, tags, content, draft: false
    }

    // axios.post(viteServer + "/create-blog", blogObj, { 
    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", { ...blogObj, id: blog_id }, { 
      headers: {
      'Authorization' :  `Bearer ${access_token}`   
    }
    })
    .then(() => {

        e.target.classList.remove("disable");

        toast.dismiss(loadingToast);
        toast.success("Published Great!")

        setTimeout(() => {
              navigate("/dashboard/blogs")
        }, 500)
    })
    .catch(({ response }) => {
        e.target.clasList.remove("disable");
        toast.dismiss(loadingToast);

        return toast.error(response.data.error)

    })
}

  return (
    <AnimationWrapper>
        <section className='w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4'>

          <Toaster />

          <button className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={handleCloseEvent}
          >
              <i className='fi fi-br-cross'></i>
          </button>

          <div className='max-w-[550px] center'>
            <p className='text-dark-grey mb-1'>PreView</p>

            <div className='w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4'>
                {/* <img src="../src/imgs/blog banner.png"></img> */}
                <img src={banner}></img>
            </div>
          

          <h1 className='text-4xl font-medium mt-2 leading-tight line-clamp-2'>{title}</h1>

          <p className='font-gelasio line-clamp-2 text-xl leading-7 mt-4'>{ des }</p>
        </div>

        <div className='border-grey lg:border-1 lg:pl-8'>
            <p className='text-dark-grey mb-2 mt-9'>Blog Title</p>
            <input type='text' placeholder='Blog Title' defaultValue={title} className='input-box pl-4' onChange={handleBlogTitleChange}/>

            <p className='text-dark-grey mb-2 mt-9'>Short description about Your blog</p>
            
            <textarea 
                maxLength={characterLimit}
                defaultValue={des}
                className='h-40 resize-none leading-7 input-box pl-4'
                onChange={handleBlogDescriptionChange}
                onKeyDown={handleTitleKeyDown}
            >

            </textarea>

            <p className='mt-1 text-dark-grey text-sm text-right'>{des ? characterLimit - des.length : characterLimit} character left</p>

            <p className='text-dark-grey mb-2 mt-9'>Topics - ( Helps in searching and ranking your blog post) </p>

            <div className='relative input-box pl-2 py-2 pb-4'>
                <input type='text'
                id='new'
                placeholder='Topic'
                className='sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white'
                onKeyDown={handleKeyDown}
                />

                { 
                    tags && tags.map((tag, i) => {
                        return <Tag tag={tag} tagIndex={i} key={i} />;
                    }) 
                
                }


            </div>
                <p className='mt-1 mb-4 text-dark-grey text-right '>{tagLimit - tags.length } Tags Left</p>

                <button className='btn-dark px-8'
                  onClick={publishBlog}
                >Publish</button>
        </div>
        </section>
    </AnimationWrapper>
  )
}

export default PublishForm;
