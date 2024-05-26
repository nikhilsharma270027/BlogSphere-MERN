import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserContext } from '../App';
import { Navigate, useParams } from "react-router-dom"
import BlogEditor from '../components/blog-editor.component';
import PublishForm from '../components/publish-form.component';
import Loader from '../components/loader.component';
import axios from 'axios';

const blogStructure = { //1:36
    title: '',
    banner: '',
    content: [],
    tags: [ ],
    des: "",
    author: { personal_info: {  } }
}

export const EditorContext = createContext(blogStructure);

const Editor = () => {

  let { blog_id } = useParams();//p4 1:40kb

  const [ blog, setBlog ] = useState(blogStructure)

    const [ editorState, setEditorState ] = useState("editor");

    const [ textEditor, setTextEditor ] = useState({ isReady: false });
    const [ loading, setLoading ] = useState(null);

    let { userAuth: { access_token } } = useContext(UserContext);
    //UserContext.userAuth.access_token

    useEffect(() => {

      if(!blog_id){
        return setLoading(false)
      }
      //retriving data in already existing blog for editting it
      axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", { blog_id, draft: true, mode: 'edit' })
      .then(({ data: { blog } })=> {
          setBlog(blog);
          setLoading(false)
          console.log(blog);
      })
      .catch(err => {
        setBlog(null);
        setLoading(false)
        console.log(err);
      })
    }, [])

  return (
        <EditorContext.Provider value={{ blog, setBlog, editorState, setEditorState, textEditor, setTextEditor }}>
          {
            access_token === null ? <Navigate to="/signin" /> 
            : 
            loading ? <Loader /> :
            editorState == "editor" ? <BlogEditor /> : <PublishForm />
          }
        </EditorContext.Provider>
    
  )
}

export default Editor
