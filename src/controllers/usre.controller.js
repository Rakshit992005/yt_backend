import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"


const registerUser = asyncHandler(async (req , res) => {
    //get user details fro frontend
    //validate - not empty
    //check if user already exits: username, email
    //check for imgs, check for avatar
    // upload them on cloudinary
    //create usre object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return respons

    const {fullName , email , username , password} = req.body
    // console.log(email);
    // console.log(fullname);
    // console.log(username);
    // console.log(password);

    if(
        [fullName , email , username , password].some( (field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400 , "all fields is Required")
    }

    const exitedUser = await User.findOne({
        $or : [{username} , {email}],
    })

    if(exitedUser){
        throw new ApiError(409 , "user with same username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    console.log(avatarLocalPath)
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required")
    }
    // if(!coverImageLocalPath){
    //     throw new ApiError(400 , "Cover Image file is required")
    // }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400 , "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email ,
        password,
        username : username.toLowerCase(),

    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201 , createdUser , "User Registed Successfully ")
    )


})

export { registerUser }