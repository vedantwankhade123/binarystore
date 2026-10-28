import {chromium,expect} from '@playwright/test'
import {initializeApp} from 'firebase-admin/app'
import {getAuth} from 'firebase-admin/auth'
import {getFirestore,FieldValue} from 'firebase-admin/firestore'
import {loadEnv} from 'vite'
import {cloud} from '../server/media.ts'

// Requires a separately started, isolated Vite server in emulator mode.
const base='http://127.0.0.1:5177'
const config=await fetch(`${base}/src/lib/firebase/client.ts`).then(response=>response.text())
if(!config.includes('"VITE_FIREBASE_PROJECT_ID": "demo-shopsphere"'))throw new Error('Browser verification requires the demo-shopsphere emulator configuration.')
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
process.env.GCLOUD_PROJECT='demo-shopsphere'
Object.assign(process.env,loadEnv('development',process.cwd(),'CLOUDINARY_'))
let sellerUid,productId
const productTitle=`Browser Product ${Date.now()}`
const admin=initializeApp({projectId:'demo-shopsphere'}),adminAuth=getAuth(admin),browser=await chromium.launch({channel:'chrome',headless:true}),email=`seller-ui-${Date.now()}@example.test`
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),failures=[]
 page.on('pageerror',error=>failures.push(error.message))
 await page.route('https://fakestoreapi.com/products*',route=>route.fulfill({json:[{id:1000,title:'Fake Store Browser Sample',description:'Sample product',category:'electronics',price:10,image:'https://example.test/sample.jpg',rating:{rate:4,count:1}}]}))
 await page.goto(`${base}/seller/register`,{waitUntil:'domcontentloaded'})
 await page.getByLabel('Full name',{exact:true}).fill('Independent Seller')
 await page.getByLabel('Email address',{exact:true}).fill(email)
 await page.getByLabel('Password',{exact:true}).fill('Tutorial123!')
 await page.getByLabel('Confirm password',{exact:true}).fill('Tutorial123!')
 await page.getByRole('checkbox',{name:'I agree to the account terms'}).check()
 await page.getByRole('button',{name:'Create account',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Verify your email.'})).toBeVisible({timeout:20000})
 const account=await adminAuth.getUserByEmail(email);sellerUid=account.uid;await adminAuth.updateUser(account.uid,{emailVerified:true})
 await page.getByRole('button',{name:'I’ve verified my email'}).click()
 await expect(page.getByRole('heading',{name:'Your store at a glance'})).toBeVisible({timeout:30000})
 await expect(page.getByText('Demo seller',{exact:true})).toHaveCount(0)
 await expect(page.getByText('Your revenue chart will appear when orders arrive.')).toBeVisible()
 await page.goto(`${base}/seller/settings`,{waitUntil:'domcontentloaded'})
 await page.getByLabel('Store name',{exact:true}).fill('Independent Store')
 await page.getByLabel('Store description',{exact:true}).fill('A real seller store')
 await page.getByLabel('Business address',{exact:true}).fill('123 Main Street')
 await page.getByRole('button',{name:'Save settings',exact:true}).click()
 await expect(page.getByText('Store settings saved.',{exact:true})).toBeVisible()
 await page.reload({waitUntil:'domcontentloaded'})
 await expect(page.getByLabel('Store name',{exact:true})).toHaveValue('Independent Store')
 await page.goto(`${base}/seller/products/new`,{waitUntil:'domcontentloaded'})
 await page.getByLabel('Product title',{exact:true}).fill(productTitle)
 await page.getByLabel('Description',{exact:true}).fill('Stored in Firestore from the seller form')
 await page.locator('select[name="category"]').selectOption('Accessories')
 await page.getByLabel('Price ($)',{exact:true}).fill('25')
 await page.getByLabel('SKU',{exact:true}).fill(`BROWSER-${Date.now()}`)
 await page.getByLabel('Stock quantity',{exact:true}).fill('5')
 await page.locator('select[name="status"]').selectOption('Active')
 await page.locator('input[type="file"]').setInputFiles('public/images/hero.jpg')
 await expect(page.getByText('Uploaded',{exact:true})).toBeVisible({timeout:90000})
 await page.getByRole('button',{name:'Add product',exact:true}).click()
 await expect(page.getByRole('link',{name:`Edit ${productTitle}`,exact:true})).toBeVisible({timeout:15000})
 productId=(await page.getByRole('link',{name:`Edit ${productTitle}`,exact:true}).getAttribute('href')).split('/')[3]
 await page.goto(`${base}/shop`,{waitUntil:'domcontentloaded'})
 const real=page.locator('.product-card').filter({hasText:productTitle}).first().getByText('Real',{exact:true})
 const fake=page.locator('.product-card').filter({hasText:'Fake Store Browser Sample'}).getByText('Fake',{exact:true})
 await expect(real).toBeVisible({timeout:20000});await expect(real).toHaveCSS('background-color','rgb(24, 112, 68)')
 await expect(fake).toBeVisible();await expect(fake).toHaveCSS('background-color','rgb(207, 39, 113)')
 await page.screenshot({path:'real-seller-store-preview.png'})
 await page.goto(`${base}/seller`,{waitUntil:'domcontentloaded'})
 await page.getByRole('button',{name:'Seller profile menu'}).click()
 await page.getByRole('button',{name:'Log out',exact:true}).click()
 await page.getByRole('dialog').getByRole('button',{name:'Log out',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Sign in to your store.'})).toBeVisible({timeout:15000})
 await page.getByLabel('Email address',{exact:true}).fill(email)
 await page.getByLabel('Password',{exact:true}).fill('Tutorial123!')
 await page.getByRole('button',{name:'Log in',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Your store at a glance'})).toBeVisible({timeout:20000})

 await page.goto(`${base}/shop`,{waitUntil:'domcontentloaded'})
 const card=page.locator('.product-card').filter({hasText:productTitle})
 await card.getByRole('button',{name:`Save ${productTitle}`}).click()
 await expect.poll(async()=> (await getFirestore(admin).doc(`wishlists/${sellerUid}/items/firestore:${productId}`).get()).exists).toBe(true)
 await page.goto(`${base}/wishlist`,{waitUntil:'domcontentloaded'})
 await expect(page.getByText(productTitle,{exact:true})).toBeVisible()
 await page.reload({waitUntil:'domcontentloaded'})
 await expect(page.getByText(productTitle,{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Move to bag',exact:true}).click()
 await expect.poll(async()=> (await getFirestore(admin).doc(`carts/${sellerUid}/items/firestore:${productId}`).get()).exists).toBe(true)
 await page.goto(`${base}/cart`,{waitUntil:'domcontentloaded'})
 await expect(page.getByText(productTitle,{exact:true})).toBeVisible()
 await page.getByRole('link',{name:'Proceed to checkout',exact:false}).click()
 for(const [name,value]of Object.entries({fullName:'Browser Customer',phone:'2025550123',address:'123 Main Street',city:'Sample City',state:'California',postalCode:'90210',country:'United States'}))await page.locator(`input[name="${name}"]`).fill(value)
 await page.getByRole('button',{name:'Continue to review',exact:true}).click()
 await page.getByRole('button',{name:'Continue to payment',exact:true}).click()
 await page.getByRole('button',{name:'Place order',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Your order is placed!',exact:true})).toBeVisible({timeout:20000})
 const orderId=page.url().split('/orders/')[1].split('/')[0]
 await expect.poll(async()=> (await getFirestore(admin).doc(`products/${productId}`).get()).data().stock).toBe(4)
 await page.goto(`${base}/seller/orders`,{waitUntil:'domcontentloaded'})
 for(const status of ['Processing','Shipped','Out for Delivery','Delivered']){
  await page.locator('.order-status-select').first().selectOption(status)
  await page.getByRole('dialog').getByRole('button',{name:'Update status',exact:true}).click()
  await expect(page.locator('.order-status-select').first()).toHaveValue(status)
 }
 await page.goto(`${base}/orders/${orderId}`,{waitUntil:'domcontentloaded'})
 await expect(page.locator('.order-status').first()).toHaveText('Delivered')
 await page.goto(`${base}/cart`,{waitUntil:'domcontentloaded'})
 await expect(page.getByRole('heading',{name:'Your bag is waiting for a good find.',exact:true})).toBeVisible()
 if(failures.length)throw new Error(failures.join('\n'))
 console.log(JSON.stringify({sellerSignup:true,automaticEnrollment:true,emptyRealAnalytics:true,settingsPersisted:true,publishedListing:true,realAndFakeBadges:true,logoutAndSellerLogin:true,actualBrowserCloudinaryUpload:true,wishlistPersistence:true,cart:true,cashOnDeliveryCheckout:true,stockUpdated:true,sellerFulfillment:true,customerTracking:true}))
}catch(error){const page=browser.contexts()[0]?.pages()[0];if(page)console.error((await page.locator('body').innerText()).slice(-1800));throw error}finally{await browser.close();if(sellerUid){const db=getFirestore(admin),assets=await db.collection('imageUploads').where('ownerId','==',sellerUid).get();for(const asset of assets.docs){if(asset.data().publicId.startsWith(`binarystore/products/${sellerUid}/`))await cloud().uploader.destroy(asset.data().publicId,{invalidate:true}).catch(()=>{});await asset.ref.update({state:'deleted',expiresAt:FieldValue.delete()})}if(productId)await db.doc(`products/${productId}`).delete()}await admin.delete()}
