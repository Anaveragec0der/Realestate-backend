import { model, Schema, ObjectId } from "mongoose"

const schema = new Schema({
    photos: [{}],
    price: { type: Number, maxLength: 255 },
    address: { type: String, maxLength: 255, required: true },
    bedrooms:  Number, 
    bathrooms:  Number, 
    landsize: String, 
    carpark: Number,
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates:{
            type:[Number],
            default:[28.5544817,77.3439171]
        }
    },
    title:{
        type:String,
        maxLength:255,
    },
    //slug is used to make urls more readable
    slug:{
        type:String,
        lowercase:true,
        unique:true,
    },
    description:{}, 
    postedBy:{type: ObjectId, ref:'User'},
    sold:{type:Boolean,default:false},
    googleMap:{},
    type:{
        type:String,
        default:'Other'
    },
    action:{
        type:String,
        default:'Sell'
    },
    views:{
        type:Number,
        default:0,
    }
}, { timestamps: true }
)

export default model("Ad", schema)