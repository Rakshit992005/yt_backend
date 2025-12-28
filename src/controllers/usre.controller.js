import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"

const generateAccessAndReferechTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return { accessToken , refreshToken };
    }
    catch (error){
        throw new ApiError(500 , "something went wrong while generating refresh and access token" , error)
    }
}


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


const loginUser = asyncHandler(async (req , res) =>{
    //req.body -> data
    //username or email pe login 
    //find the user form username or email
    //check password
    //access and refresh token
    //send cookie

    const { email , username , password } = req.body;

    if(!username && !email){
        throw new ApiError(400 , "username and email are requires")
    }

    const user = await User.findOne({
        $or :[
            {username} , {email}
        ]
    });

    if(!user){
        throw new ApiError(404 , " user doesnot exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid User Credentials")
    }

    const { accessToken , refreshToken} = await generateAccessAndReferechTokens(user._id);

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken,
            },
            "user logged In successfully",
        )
    )
})


const loggoutUser = asyncHandler(async (req , res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        }
    )

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "user logedout successfully"))

})


const refreshAccessTokene = asyncHandler( async (req , res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, " unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401 , " Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401 , "Refresh token is expiedr or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true,
        }
    
        const { accessToken , newRefreshToken } = await generateAccessAndReferechTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , newRefreshToken , options)
        .json(
            new ApiResponse(
                200 ,
                {accessToken , newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }
})


export { registerUser , loginUser , loggoutUser , refreshAccessTokene}