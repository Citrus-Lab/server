import mongoose from "mongoose"

const userSchema = ({
name: {
    type: String,
    required: true
},
email:{
    type: String,
    required: true,
    unique: true
},
password: {
    type: String,
    required: true,
},
role:{
    type: String,
    enums:["user","Admin"],
    default: "user"
}
})

export default mongoose.model("User", userSchema)