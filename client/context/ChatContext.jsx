import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import toast from "react-hot-toast";
import { ChatContext } from "./ChatContext.js";


//export const ChatContext = createContext();

export const ChatProvider = ({children}) =>{

    const [messages, setMessages ]= useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const {socket, axios} = useContext(AuthContext);

    const getUsers = async () =>{
        try{
            const {data} = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch(error){
            console.log(error.message);
            toast.error(error.message);
        }
    }

    const getMessages = async (userId)=>{
        try {
            const {data} = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const sendMessage = async (messageData) =>{
        try{
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages, data.newMesage])
            }else{
                toast.error(data.message);
            }
        } catch (error){
            toast.error(error.message)
        }
    }

    const subscribeToMessages = async ()=>{
        if(!socket) return;

        socket.on("newMessage",(newMesage)=>{
            if(selectedUser && newMesage.senderId === selectedUser._id){
                newMesage.seen = true;
                setMessages((prevMessages)=>[...prevMessages, newMesage]);
                axios.put(`/api/messages/mark/${newMesage._id}`);
            }else{
                setUnseenMessages((prevUnseenMessages)=>({...prevUnseenMessages, [newMesage.senderId] : prevUnseenMessages[newMesage.senderId] ? prevUnseenMessages[newMesage.senderId] + 1 : 1}))
            }
        })
    }

    const unsubscribeFromMessages = ()=>{
        if(socket) socket.off("newMessage");
    }

    useEffect(()=>{
        subscribeToMessages();
        return ()=> unsubscribeFromMessages();
    },[socket,selectedUser])

    const value = {
        messages,users,selectedUser,getUsers, getMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages
    }
    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}