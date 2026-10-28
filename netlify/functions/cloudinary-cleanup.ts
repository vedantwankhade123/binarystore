import {cleanupUploads} from '../../server/media.ts'
export const config={schedule:'@hourly'}
export default async()=>{await cleanupUploads()}
