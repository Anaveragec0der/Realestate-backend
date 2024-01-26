import jwt from "jsonwebtoken"
import * as config from '../config.js'
// import {hashPassword,comparePasword} from '../helpers/auth.js'
import bcrypt, { compare } from 'bcrypt'
import User from "../models/user.js"
import validator from 'email-validator'
import { nanoid } from "nanoid"
import Ad from '../models/ad.js'
const bcryptSalt=bcrypt.genSaltSync(12)

const tokenAndUserResponse=(user,req,res)=>{
    const token=jwt.sign({_id:user._id}, config.JWT_SECRET,{
        expiresIn:"1h"
    })

    const refreshToken=jwt.sign({_id:user._id}, config.JWT_SECRET,{
        expiresIn:"7d"
    })

    //we are setting the user.passsword and resetcode asn undefined because we
    //dont want this information to be shown in the response
    user.password=undefined
    user.resetCode=undefined
    return res.json({
        token,
        refreshToken,
        user,
    })
}

export const welcome=(req,res)=>{
    res.json({
        data:"hello my server works even from routes and controllers....!!!"
    })
}

export const preRegister=async(req,res)=>{
    //we will be creating jwt with email and password then email it as a clickble link
    //only when user clicks on the email link, the reistration will compelete
    try{
        //creating jwt from email and password sent from req.body from the frontend
        const {email, password}=req.body;
        
        //Validating the email using validator 

        if(!validator.validate(email)){
            return res.json({error:'A valid email is required'})
        }

        if(!password){
            return res.json({error:'A password is required'})
        }
        if(password && password.length<6){
            return res.json({error:"password should be atleast 6 characters"})
        }

        const user=await User.findOne({email})

        if(user){
            return res.json({error:'This email is already registered'})
        }
        //creating a sign token from email and password 
        //second argument will be a JWT Secret only know to our app and stored in config.js
        //third argument will be the expriing time of this token
        const token=jwt.sign({email,password},config.JWT_SECRET,{
            expiresIn:"1h"
        })
        // console.log(req.body)
        const emailSent=true
        if(emailSent){
            console.log(token)
            return res.json({ok:true})
        }
        else{
            return res.json({notOk : false})
        }

    }
    catch(err){
        console.log(err)
        return res.json({error:"Something went wrong"})
    }
}
export const register= async(req, res)=>{
    try{
        //here we will be verifying the token that is sent to the register route 
        //against the JWT secret 
        // const decoded=jwt.verify(req.body.token,config.JWT_SECRET);
        const{email,password}=jwt.verify(req.body.token,config.JWT_SECRET)
        const userExist=await User.findOne({email})

        if(userExist){
            return res.json({error:'This email is already registered'})
        }
        const hashedPassword= bcrypt.hashSync(password,bcryptSalt)
        const user =await new User({
             username: nanoid(6),
             email,
             password:hashedPassword,
        }).save()

        tokenAndUserResponse(user,req,res)
        // console.log(email)
        // console.log(password)
        // return res.json({nice: "everything went right"})
    }
    catch(err){
        console.error(err)
        return res.json({error:"Something went wrong. Try again"})
    }
}

export const login= async (req,res)=>{
    try{
        const {email,password}=req.body
        //find user by email
        const user =await User.findOne({email})
        if(!user){
            return res.json({error:'No user found. Please register'})
        }
        //compare password
        const match =bcrypt.compareSync(password,user.password)
        if(!match){
            return res.json({error:"Wrong Password"})
        }
       tokenAndUserResponse(user,req,res)
    }catch(err){
        console.error(err)
        return res.json({error:err})
    }
}
export const forgotPassword=async(req,res)=>{
    try{
        const {email}=req.body
        const user=await User.findOne({email})
        if(!user){
            return res.json({error: "could not find user with that email"});
        }
        else{
            const resetCode=nanoid()
            user.resetCode=resetCode
            user.save()
            const token=jwt.sign({resetCode},config.JWT_SECRET,{
                expiresIn:"1h",
            })
            console.log(token)
            return res.json({ok:"check your email for resetting the password"})
        }
    }
    catch (err){
        console.log(err)
        return res.json({error: err})
    }
}
export const accessAccount=async(req,res)=>{
    try{
        //in database we have stored token as the resetCode which is the nano id 
        //and have named it as resetCode so we will destructure it here as resetCode
        //so that the name in the database and from the frontend remains consistent 
        //also we will send the data from the frontend by the name of resetCode
      const {resetCode}=jwt.verify(req.body.resetCode,config.JWT_SECRET)

    //   console.log("=========", resetCode);

    //this is done so that same link cannot be used again and again to reset the password
    //we will be setting resetCode as empty once the link is clicked to update the code 
      const user=await User.findOneAndUpdate({resetCode:resetCode},{resetCode:""})
    
      //creating a token for sign in once  the resetCode is found in the database
      tokenAndUserResponse(user,req,res)
    }
    catch(err){
        console.error(err)
        return res.json({error: err})
    }
}
 export const refreshToken=async(req,res)=>{
    try{
        const {_id}=jwt.verify(req.headers.refresh_token,config.JWT_SECRET)
        const user=await User.findById(_id)
        const token=jwt.sign({_id:user._id},config.JWT_SECRET,{
            expiresIn:"1h",
        })
        tokenAndUserResponse(user,req,res)
    }catch(err){
        console.log(err)
        return res.status(403).json({error:'refresh token failed'})
    }
 }
export const currentUser= async(req,res)=>{
    try{
        const user=await User.findById(req.user._id)
        user.password=undefined
        user.resetCode=undefined
        res.json(user)
    }catch(err){
        console.error(err)
        return res.status(403).json({error:"unauthorized"})
    }
}
export const publicProfile=async(req,res)=>{
    try{
        //here we will be finding the user based on the username passed from the params
        //profile/:username
        const user=await User.findOne({username: req.params.username})
        user.password=undefined
        user.resetCode=undefined
        res.json(user)
    }catch(err){
        console.error(err)
        return res.json({error:"User not found"})
    }
}

export const updatePassword=async(req,res)=>{
    try{
        const {password}=req.body
        if(!password){
            return res.json({error:'Password is required'})
        }
        if(password && password.length <6){
            return res.json({error:"Password should be atleast 6 characters long"})
        }
        const user=await User.findByIdAndUpdate(req.user._id,{
            password: bcrypt.hashSync(password,bcryptSalt),
        })
        res.json({Done:"Password Updated"})
    }catch(err){
        console.error(err)
        return res.status(403).json({error:"Unauthorized"})
    }
}
export const updateProfile=async(req,res)=>{
    try{
        //findByIdAndUpdate uses 3 parameters first is to find what document must be 
        //updated
        //second is the data to be updated 
        //third is to return the updated document 
        const user=await User.findByIdAndUpdate(req.user._id,req.body,{
            new:true,
        })
        user.password=undefined
        user.resetCode=undefined
        res.json(user)
    }
    catch(err){
        console.error(err)
        if(err.codeName==='DuplicateKey'){
         res.json({error:'Username or email is already taken'})
        }else{
            return res.status(403).json({error:"Unauthorized"})
        }
    }
}

export const agents=async(req,res)=>{
    try{
        const agents=await User.find({role:'Seller'}).select('-password -role -enquiredProperties -wishlist')
        res.json(agents)
    }catch(err){
        console.error(err)
    }
}   
export const agentAdCount=async(req,res)=>{
    try{
        const ads= await Ad.find({postedBy: req.params._id}).select('_id')
        res.json(ads)
    }catch(err){
        console.error(err)
    }
}   
export const agent=async(req,res)=>{
    try{
        const user=await User.findOne({username:req.params.username}).select('-password -role -enquiredProperties -wishlist')
        const ads=await Ad.find({postedBy:user._id})
        res.json({user,ads})
    }catch(err){
        console.error(err)
    }
}   
