import Express from "express";
//import authMiddleware from "../MiddleWare/authMiddleWare.js";
// import { verifyUser } from '../utils/verifyToken.js'
import { deleteUser, followUser, getUser, unfollowUser, updateUser , getAllUsers } from "../Controllers/UserController.js";

const router = Express.Router();

router.get('/all-users' , getAllUsers);
router.get('/:id' , getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/follow', followUser);
router.put('/:id/unfollow', unfollowUser);


export default router;