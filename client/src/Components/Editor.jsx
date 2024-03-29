import {Box} from "@mui/material"
import Quill from "quill"
import 'quill/dist/quill.snow.css';
import { useEffect,useRef,useState } from "react";
import styled from "@emotion/styled"
import {io} from "socket.io-client"
import { useParams } from "react-router-dom";
import {NavBar} from "./NavBar"
import * as quillToWord from 'quill-to-word';
import { saveAs } from 'file-saver';
import { useSelector, useDispatch } from 'react-redux'
const Component = styled.div`
background: #F5F5F5;
margin: 0;
padding: 0;
`
const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],
  
    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction
  
    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],
  
    ['clean']                                         // remove formatting button
];

export function Editor(){
    const [socket,setSocket] = useState()
    const [quill,setQuill] = useState()
    const {id} = useParams();
    const count = useSelector(state => state.counter.value)
    const hasPagebeenRendered = useRef(false)

    useEffect(()=>{
        const firstRender = 0;
          const quillServer = new Quill('#container',{theme: 'snow',modules:{toolbar:toolbarOptions}})
          quillServer.disable();
          quillServer.setText('Loading.....')
          setQuill(quillServer)
    },[])

    useEffect(()=>{
        const url =import.meta.env.VITE_API_KEY;
        console.log(url)
        const socketServer = io(url);
        console.log(socketServer)
        setSocket(socketServer)
        return ()=>{
            socketServer.disconnect();
        }
    },[])

    useEffect(()=>{
        if(socket === null || quill === null){
            return 
        }
        const handleChange = (delta,oldData,source)=>{
                if(source !== 'user') return 
                socket && socket.emit('send-changes',delta)
            }
        quill && quill.on('text-change',handleChange)
        return ()=>{
            quill && quill.off('send-change',handleChange)
        }
        
    },[quill,socket])

    useEffect(()=>{
        if(socket === null || quill === null){
            return 
        }
        const handleChange = (delta)=>{
            quill.updateContents(delta);
        }

        socket && socket.on('receive-changes',handleChange)
        return ()=>{
            socket && socket.off('receive-changes',handleChange)
        }
        
    },[quill,socket])
    
    useEffect(()=>{
        if(quill === null || socket === null) return;
        socket && socket.once('load-document',document =>{
            quill.setContents(document)
            quill.enable()
        })
        socket && socket.emit('get-document' ,id)
    },[quill,socket,id])

    useEffect(()=>{
        if(socket === null || quill === null) return ;
        const interval = setInterval(async ()=>{
            socket && socket.emit('save-document',quill.getContents())
        },2000)
        return async()=>{
            clearInterval(interval)
        }
    },[socket,quill])

    useEffect(()=>{
        const func = async ()=>{
            const delta = quill.getContents();
            const quillToWordConfig = {
                exportAs: 'blob'
            };
            const doc = await quillToWord.generateWord(delta, quillToWordConfig);
            // console.log(count)
            saveAs(doc, 'word-export.docx');
            
        }
        if(hasPagebeenRendered.current){
            return ()=>{
                func()
            }
        } 
        hasPagebeenRendered.current =true
    },[count])

    return (
    <Component>
        <NavBar></NavBar>
        <Box className="container"id="container"></Box>
    </Component>
    )
} 








