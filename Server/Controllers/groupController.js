import Group from '../Models/groupModel.js';
import Profile from '../Models/profileModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const createGroup = catchAsync(async (req, res) => {
  const newGroup = await Group.create({
    ...req.body,
    admin: req.user._id,
    members: [req.user._id]
  });

  await Profile.findOneAndUpdate(
    { user: req.user._id },
    { $push: { groups: newGroup._id } }
  );

  res.status(201).json({
    status: 'success',
    data: newGroup
  });
});

export const getGroup = catchAsync(async (req, res) => {
    const group = await Group.findById(req.params.groupId)
      .populate('admin', 'name username profilePicture')
      .populate('members', 'name username profilePicture');
  
    if (!group) {
      throw new AppError('Group not found', 404);
    }
  
    res.status(200).json({
      status: 'success',
      data: group
    });
  });
  
  export const joinGroup = catchAsync(async (req, res) => {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      throw new AppError('Group not found', 404);
    }
  
    if (group.members.includes(req.user._id)) {
      throw new AppError('You are already a member of this group', 400);
    }
  
    group.members.push(req.user._id);
    await group.save();
  
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { groups: group._id } }
    );
  
    res.status(200).json({
      status: 'success',
      message: 'Successfully joined group'
    });
  });
  
  export const leaveGroup = catchAsync(async (req, res) => {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      throw new AppError('Group not found', 404);
    }
  
    if (!group.members.includes(req.user._id)) {
      throw new AppError('You are not a member of this group', 400);
    }
  
    if (group.admin.toString() === req.user._id.toString()) {
      throw new AppError('Group admin cannot leave the group', 400);
    }
  
    group.members = group.members.filter(id => id.toString() !== req.user._id.toString());
    await group.save();
  
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { groups: group._id } }
    );
  
    res.status(200).json({
      status: 'success',
      message: 'Successfully left group'
    });
  });