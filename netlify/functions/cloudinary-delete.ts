import {handleRequest} from '../../server/http.ts'
export default (request:Request)=>handleRequest(new Request(new URL('/api/deleteUpload',request.url),request))
