import slugify from "slugify"
import Ad from '../models/ad.js'
import User from '../models/user.js'
import {nanoid} from 'nanoid'
export const create= async(req,res)=>{
    try{
        console.log(req.body)
        const {photos,description,title,address,price,type,landsize}=req.body
        // // if(!photos?.length){
        // //     return res.json({error:"Photos are required"})

        // }
        if(!price){
            return res.json({error:"price is required"})
        }
        if(!type){
            return res.json({error:"Is property land or a house?"})
        }
        if(!description){
            return res.json({error:"Description is required"})
        }
        const ad=await new Ad({
            ...req.body,
            postedBy:req.user._id,
            location:{
                type:'Point',
                coordinates:['123456','654321']
            },
            slug:slugify(`${type}-${address}-${price}-${nanoid(6)}`)
        }).save()
        //making the user role as seller from buyer as now the user is posting an Ad
        const user=await User.findByIdAndUpdate(req.user._id ,{
            $addToSet :{role:'Seller'},
        },
        {new:true}
        )
        user.password=undefined
        user.resetCode=undefined
        res.json({
            ad,
            user
        })
    }catch(err){
        console.error(err)
        res.json({error:'Something went wrong'})
    }
}

export const ads=async(req,res)=>{
    try{
        const adsForSell=await Ad.find({action:'Sell'}).select('-location')
        .sort({createdAt:-1})
        .limit(12)
        const adsForRent=await Ad.find({action:'Rent'}).select('-location')
        .sort({createdAt:-1})
        .limit(12)
        res.json({adsForSell,adsForRent})
    }catch(err){
        console.error(err)
    }
}

export  const read =async (req,res)=>{
    try{
        const ad= await Ad.findOne({slug:req.params.slug }).populate(
            "postedBy",
            'name username email phone company photo.location'
        )
        // console.log(ad)
        //to show related ads we will take the address of the selected place from the database
        //and then find all the other places which have the same location the current selected 
        //place 
        //we can easily extract the address from the fields of the selected ad
        // const related =await Ad.find({
        //     _id:{}
        // }) 

        
        const related = await Ad.find({
            _id: { $ne: ad._id },// this means that all the _id from the database expect the
            //part where the _id is same to current _id will be excluded
            
            //this field will make sure to find the place that is for sell or rent 
            //if the place is for rent then rent related ads or else sell related ads
            action: ad.action,
            //this field will make sure to find if the place is a land or a house 
            type: ad.type,
            // address: { $regex: ad.google.Map[0].city, $options: 'i' }//this means that the 
            //city field from the google.Map[0].city will be matched case insensitively 
            //$options: 'i' means case insensitive search 
            //but as google api is not enabled I will use ad.address field to show the related
            //ad
            address: { $regex: ad.address, $options: 'i' }
          }).limit(3);
          
        res.json({ad,related})
    }catch(err){
        console.error(err)
    }
}

export const addToWishlist=async (req,res,next)=>{
    try{
        const user=await User.findByIdAndUpdate(req.user._id,{
            $addToSet:{wishlist:req.body.adId},
        },{new:true}
        )
        // console.log(user)
        const {password,resetCode,...rest}=user._doc
        res.json(rest)
    }
    catch(err){
        console.error(err)
    }
}
export const removeFromWishlist=async (req,res,next)=>{

    try{
        const user=await User.findByIdAndUpdate(req.user._id,{
            $pull:{wishlist:req.params.adId},
        },{new:true}
        )
        const {password,resetCode,...rest}=user._doc
        res.json(rest)
    }
    catch(err){
        console.error(err)
    }
}
export const contactSeller=async(req,res)=>{
    try{
        const {name ,email, message, phone, adId}=req.body
        console.log(req.body)
        const ad=await Ad.findById(adId).populate('postedBy','email')

        const user=await User.findByIdAndUpdate(req.user._id,{
            $addToSet:{enquiredProperties:adId},
        })
        if(!user){
            return res.json({error:'Could not find the user wtih that email'})
        }else{
            //send Emails
        }
    }catch(err){
        console.error(err)
    }
}
export const userAds=async (req,res)=>{
     try{
        const perPage=2
        const page=req.params.page ? req.params.page : 1
        const total= await Ad.find({postedBy:req.user._id})
        const ads=await Ad.find({postedBy:req.user._id})
        .populate('postedBy','name email username phone company')
        .skip((page -1)*perPage)
        .limit(perPage)
        .sort({createdAt: -1})
        res.json({ads, total:total.length})
     }
     catch(err){
        console.error(err)
     }
}
export const update=async(req,res)=>{
    try{
        const {photos,price,type,address,description }=req.body
        const ad=await Ad.findById (req.params._id)
        const owner=req.user._id==ad?.postedBy
        if(!owner){
            return res.json({error:"permission denied"})
        }else{
            if(!price){
                return res.json({error:"Price is required"})
            }
            if(!type){
                return res.json({error:"is property a land or a house"})
            }
            if(!address){
                return res.json({error:"address is required"})
            }
            if(!description){
                return res.json({error:"description is required"})
            }
            await ad.updateOne({
                ...req.body,
                slug:ad.slug
            })
            res.json({ok:true})
        }
    }catch(err){
        console.error(err)
    }
}

export const enquiredProperties=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id)
        const ads=await Ad.find({_id:user.enquiredProperties}).sort({createdAt:-1})
        res.json(ads)
    }catch(err){
        console.log(err)
    }
}
export const wishlist=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id)
        const ads=await Ad.find({_id:user.wishlist})
        res.json(ads)
    }catch(err){
        console.log(err)
    }
}

export const remove=async(req,res)=>{
    try{
        const ad=await Ad.findById(req.params._id)
        const owner=req.user._id=ad?.postedBy
        if(!owner){
            return res.json({error:'Permission denied'})
        }else{
            await Ad.findByIdAndRemove(ad._id)
            res.json({ok:'true'})
        }
    }catch(err){
        console.error(err)
    }
}

export const adsForSell=async(req,res)=>{
    try{
        const ads=await Ad.find({action:'Sell'}).select('-location')
        .sort({createdAt:-1})
        .limit(24)

        res.json(ads)
    }catch(err){
        console.error(err)
    }
}
export const adsForRent=async(req,res)=>{
    try{
        const ads=await Ad.find({action:'Rent'}).select('-location')
        .sort({createdAt:-1})
        .limit(24)
        res.json(ads)
    }catch(err){
        console.error(err)
    }
}

export const search=async(req,res)=>{
    try{
        // console.log('req query',req.query)
        const {action,address,type,priceRange}=req.query
        const ads=await Ad.find({
            action:action==="Buy"?"Sell":"Rent",
            type,
            price:{
                $gte:parseInt(priceRange[0]),
                $lte:parseInt(priceRange[1]),
            },
        }).limit(24).sort({createdAt:-1})
        res.json(ads)   
        console.log(ads)
    }catch(err){
        console.error(err)
    }
}