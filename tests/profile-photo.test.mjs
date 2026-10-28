import test from 'node:test'
import assert from 'node:assert/strict'
import {profilePhotoSrc,updatedProfilePhoto} from '../src/lib/profilePhoto.ts'

test('Google avatar URLs use only the fixed image proxy, while custom images stay unchanged',()=>{
 assert.equal(profilePhotoSrc('https://lh3.googleusercontent.com/a/example=s96-c'),'/profile-image/google/a/example=s96-c')
 assert.equal(profilePhotoSrc('https://lh3.googleusercontent.com/a-/example=s96-c?size=96'),'/profile-image/google/a-/example=s96-c?size=96')
 assert.equal(profilePhotoSrc('https://res.cloudinary.com/store/image/upload/avatar.jpg'),'https://res.cloudinary.com/store/image/upload/avatar.jpg')
 assert.equal(profilePhotoSrc('https://lh3.googleusercontent.com.evil.test/a/photo'),'https://lh3.googleusercontent.com.evil.test/a/photo')
 assert.equal(profilePhotoSrc(''), '')
 assert.equal(profilePhotoSrc('not a URL'), '')
})
test('Google provider photos refresh without replacing custom photos or restoring explicitly removed images',()=>{
 const fresh='https://lh3.googleusercontent.com/a/fresh=s96-c'
 assert.equal(updatedProfilePhoto('https://lh3.googleusercontent.com/a/old=s96-c',fresh),fresh)
 assert.equal(updatedProfilePhoto('',fresh),fresh)
 assert.equal(updatedProfilePhoto('https://res.cloudinary.com/store/avatar.jpg',fresh),'https://res.cloudinary.com/store/avatar.jpg')
 assert.equal(updatedProfilePhoto('',null),'')
})
