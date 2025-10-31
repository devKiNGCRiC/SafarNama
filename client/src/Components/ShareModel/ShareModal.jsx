import React from 'react';
import './ShareModal.scss'; // We'll create this file next

import PostShare from '../PostShare/PostShare';

const ShareModal = ({ modalOpened, setModalOpened }) => {
  if (!modalOpened) return null;

  return (
    <div className="modal-overlay2" onClick={() => setModalOpened(false)}>
        <div className="modal-content2" onClick={(e) => e.stopPropagation()}>
            <PostShare/>
            <div>
                <button className='button sm-button' onClick={() => setModalOpened(false)}>Close</button>
            </div>
        </div>
    </div>
  );
};

export default ShareModal;
