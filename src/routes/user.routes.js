import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loggoutUser, loginUser, refreshAccessTokene, registerUser, updateAccountDetails, updateUserAvatar } from "../controllers/usre.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middlerware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount : 1,
        },
        {
            name : "coverImage",
            maxCount : 1,
        }

    ]),
    registerUser,
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT , loggoutUser)

router.route("/refresh-token").post(refreshAccessTokene)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT , getCurrentUser)

router.route("/update-account").patch(verifyJWT , updateAccountDetails)

router.route("/avatar").patch(verifyJWT , upload.single("avatar") , updateUserAvatar)

router.route("/coverImage").patch(verifyJWT , upload.single("coverImage") , updateUserAvatar)

router.route("/c/:username").get(verifyJWT , getUserChannelProfile)

router.route("/watch-history").get(verifyJWT, getWatchHistory)


export default router