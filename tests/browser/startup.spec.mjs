import { test, expect } from '@playwright/test'

for(const path of ['/','/shop','/login','/register','/seller/login','/seller/register','/seller/forgot-password'])test(`renders ${path} without startup errors`,async({page})=>{
 const errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 page.on('response',response=>{if(response.status()>=500&&new URL(response.url()).origin==='http://localhost:5173')errors.push(`${response.status()} ${new URL(response.url()).pathname}`)})
 await page.goto(path,{waitUntil:'domcontentloaded'})
 await expect(page.getByRole('link',{name:'BinaryStore home',exact:true}).first()).toBeVisible()
 await expect(page.locator('#root')).not.toBeEmpty()
 await expect(page.getByRole('heading',{level:1}).first()).toBeVisible()
 expect(errors).toEqual([])
})
