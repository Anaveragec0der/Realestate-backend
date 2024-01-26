import express from 'express'
const router=express.Router()
import * as auth from '../controllers/auth.js'
import { requireSignin } from '../middlewares/auth.js'


//we will not save user directly to the databse we will send an confirmation email to the provided
//email and then send them a link which if they can click it then we will confirm their registration
//we should only allow logged in user to post ads and access some of the routes and hence 
//we need to protect our routes to do so, whenever user tries to access these private routes 
//we must also send token as headers in the request body from the frontend 
//these headers will help us to verify if the user is logged in or not 
//the tokens were created using the user._id in our database and hence we will verify this 
//token in our server and then with the help of this id we will be able to get more information
//about user in the database 
//hence we need to create a middleware to protect the routes
//using requiresSignin here will make it such that this route will only be accessible to
//logged in user if we want to access this route then we need to pass tokens in the headers of 
//get request from postman app to access this 
router.get('/',requireSignin,auth.welcome)
router.post('/pre-register', auth.preRegister)
router.post('/register', auth.register)
router.post('/login',auth.login)
router.post('/forgot-password',auth.forgotPassword)
router.post('/access-account',auth.accessAccount)
//route for refreshing the tokens
router.get('/refresh-token',auth.refreshToken)
router.get("/current-user",requireSignin,auth.currentUser)
//creating route for public viewing of the profile
router.get('/profile/:username',auth.publicProfile)
//creating route to update the user password
router.put('/update-password',requireSignin,auth.updatePassword)
//creating a route to update the profile 
router.put('/update-profile',requireSignin,auth.updateProfile)

router.get('/agents',auth.agents)

router.get('/agent-ad-count/:_id',auth.agentAdCount)

router.get('/agent/:username', auth.agent)
export default router
