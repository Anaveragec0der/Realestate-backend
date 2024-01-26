//this file is for protecting our private routes 
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js'
//whenever we are creating a middleware we need pass a callback function here it is called 
//next but it can be called anything 
export const requireSignin=(req,res,next)=>{
    try{
        //here we will be decoding the token received in the headers from the fronted and 
        //verifying it against our JWT_SECRET
        //a doubt here because we will be sending the header as Authorization from postman
        //will this not cause erors as we are accesing it from authorization
        const decoded=jwt.verify(req.headers.authorization,JWT_SECRET)

/* The line req.user = decoded is used to store the decoded payload of the JWT in the req.user property.
 This is done so that the authenticated user's information is easily accessible in 
subsequent middleware or route handlers.
By storing the decoded payload in req.user, other parts of your application that come after this 
middleware can access the user's information conveniently.
For example, if you have another middleware or route handler that needs to access 
the user's ID to perform certain actions or retrieve additional data from a database, 
it can simply refer to req.user._id to access the user's ID without having to decode the JWT again.
*/ 
        req.user=decoded 
        next()
    }
    catch(err){
        console.error(err)
        res.status(401).json({error:"Invalid or expired token"})
    }
}