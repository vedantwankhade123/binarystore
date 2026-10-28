import { z } from 'zod'
const email=z.string().trim().min(1,'Enter your email address.').email('Enter a valid email address.').max(120,'Use 120 characters or fewer.')
export const passwordRules=[{label:'At least 8 characters',test:(value:string)=>value.length>=8},{label:'An uppercase and lowercase letter',test:(value:string)=>/[A-Z]/.test(value)&&/[a-z]/.test(value)},{label:'A number',test:(value:string)=>/\d/.test(value)},{label:'A special character',test:(value:string)=>/[^A-Za-z0-9\s]/.test(value)}]
const password=z.string().min(8,'Use at least 8 characters.').max(128,'Use 128 characters or fewer.').refine(value=>passwordRules.every(rule=>rule.test(value)),'Include uppercase and lowercase letters, a number, and a special character.')
export const loginSchema=z.object({email,password:z.string().min(1,'Enter your password.').max(128,'Use 128 characters or fewer.'),remember:z.boolean()})
export const registerSchema=z.object({name:z.string().trim().min(2,'Enter at least 2 characters.').max(80,'Use 80 characters or fewer.'),email,password,confirmPassword:z.string().min(1,'Confirm your password.'),terms:z.boolean().refine(value=>value,'Accept the account terms to continue.')}).refine(value=>value.password===value.confirmPassword,{message:'Passwords do not match.',path:['confirmPassword']})
export const forgotPasswordSchema=z.object({email})
export const completeProfileSchema=z.object({displayName:z.string().trim().min(2,'Enter at least 2 characters.').max(80,'Use 80 characters or fewer.'),phone:z.string().trim().max(25,'Use 25 characters or fewer.').refine(value=>value===''||/^[+\d\s().-]+$/.test(value)&&value.replace(/\D/g,'').length>=7&&value.replace(/\D/g,'').length<=15,'Enter a phone number with 7 to 15 digits.'),newsletter:z.boolean(),orderUpdates:z.boolean()})
export type LoginValues=z.infer<typeof loginSchema>
export type RegisterValues=z.infer<typeof registerSchema>
export type ForgotPasswordValues=z.infer<typeof forgotPasswordSchema>
export type CompleteProfileValues=z.infer<typeof completeProfileSchema>
