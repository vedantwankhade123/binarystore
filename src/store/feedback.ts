import { create } from 'zustand'
export const useFeedback = create<{notice:string;storageWarning:boolean;notify:(message:string)=>void;setStorageWarning:()=>void}>((set)=>({
 notice:'',storageWarning:false,
 notify:message=>{set({notice:message});window.setTimeout(()=>set(state=>state.notice===message?{notice:''}:{}),2600)},
 setStorageWarning:()=>set({storageWarning:true}),
}))
export const safeStorage = {
 getItem:(key:string)=>{try{return localStorage.getItem(key)}catch{useFeedback.getState().setStorageWarning();return null}},
 setItem:(key:string,value:string)=>{try{localStorage.setItem(key,value)}catch{useFeedback.getState().setStorageWarning()}},
 removeItem:(key:string)=>{try{localStorage.removeItem(key)}catch{useFeedback.getState().setStorageWarning()}},
}
