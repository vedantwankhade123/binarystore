import {handleRequest} from '../../server/http.ts'
export default (request:Request)=>handleRequest(new Request(new URL('/api/signUpload',request.url),request))
