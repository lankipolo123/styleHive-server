const mongoose = require('mongoose');

const usersSchema = mongoose.Schema({
    name:{ 
        type:String,
        required:true
    },
    email:{ 
        type:String,
        required:true
    },
    passwordHash:{ 
        type:String,
        required:true,
    },
    phone:{ 
        type:String,
        required:true,
    },
    isAdmin:{ 
        type:Boolean,
       default: false,
    },
   street:{ 
        type:String,
       default: ''
    },
    apartment:{ 
        type:String,
       default: ''
    },
    zip:{ 
        type:String,
       default: ''
    },
    city:{ 
        type:String,
        default: ''
    },
    country:{ 
        type:String,
        default: ''
    },
    
});
usersSchema.virtual('id').get(function(){
    return this._id.toHexString();
});
usersSchema.set('toJSON',{
    virtuals:true,
})

exports.Users = mongoose.model('Users', usersSchema);
exports.usersSchema =usersSchema;