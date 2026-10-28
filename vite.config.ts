import react from '@vitejs/plugin-react'
import { localServerlessApi } from './server/viteApi.ts'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
export default defineConfig({build:{rolldownOptions:{output:{manualChunks(id){if(id.includes('@firebase/firestore'))return 'firebase-firestore';if(id.includes('@firebase/auth'))return 'firebase-auth'}}}},plugins:[localServerlessApi(),react(),tailwindcss()],server:{proxy:{'/profile-image/google':{target:'https://lh3.googleusercontent.com',changeOrigin:true,rewrite:path=>path.replace(/^\/profile-image\/google/,''),configure:proxy=>{proxy.on('proxyReq',request=>{request.removeHeader('cookie');request.removeHeader('authorization');request.removeHeader('referer')})}}},fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/*firebase-adminsdk*.json','**/*service-account*.json','**/*serviceAccount*.json','**/secrets/**']}}})
