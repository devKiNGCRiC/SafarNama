import React, { useEffect, useState } from 'react';
import { Briefcase, Calendar, Globe, Link as LinkIcon, Lock, MapPin, Pencil } from 'lucide-react';
import { hostnameOf, platformLabel, safeHref } from '../../../features/profile/utils/profileLinks';
import './ProfileInfo.scss';

// The "About" card: everything about the person except the name and bio (those are in the header).
// true on screens wide enough for the side-by-side layout
const useWideScreen = () => {
    const query = '(min-width: 901px)';
    const [wide, setWide] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const media = window.matchMedia(query);
        const onChange = (e) => setWide(e.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);
    return wide;
};

const ProfileInfo = ({ user, profile, isOwnProfile, onEditClick }) => {
    const wide = useWideScreen();
    // on phones the details are folded away so the posts are the first thing under the header
    const [openOnPhone, setOpenOnPhone] = useState(false);
    const website = safeHref(profile?.website);
    const links = (profile?.socialLinks || []).filter((l) => safeHref(l.url));
    const interests = profile?.interests || [];
    const hasDetails = Boolean(profile?.location || profile?.occupation || website || interests.length || links.length || profile?.bio);

    const joined = new Date(user?.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    return (
        <section className={`pf-about ${wide || openOnPhone ? 'open' : 'folded'}`} aria-label="About">
            {wide ? (
                <h2>About</h2>
            ) : (
                <button type="button" className="pf-about-toggle" aria-expanded={openOnPhone} onClick={() => setOpenOnPhone((o) => !o)}>
                    <h2>About</h2>
                    <span>{openOnPhone ? 'Hide' : 'Show details'}</span>
                </button>
            )}
            {(wide || openOnPhone) && (
            <div className="pf-about-body">

            {!hasDetails && (
                <div className="pf-about-empty">
                    <p>{isOwnProfile ? 'Tell other travellers about yourself: add a bio, where you are based and what you love.' : 'This traveller has not added any details yet.'}</p>
                    {isOwnProfile && (
                        <button type="button" className="pf-btn primary small" onClick={onEditClick}>
                            <Pencil size={14} /> Complete your profile
                        </button>
                    )}
                </div>
            )}

            <ul className="pf-facts">
                {profile?.location && <li><MapPin size={16} /> <span>{profile.location}</span></li>}
                {profile?.occupation && <li><Briefcase size={16} /> <span>{profile.occupation}</span></li>}
                {website && (
                    <li>
                        <Globe size={16} />
                        <a href={website} target="_blank" rel="noopener noreferrer nofollow">{hostnameOf(website)}</a>
                    </li>
                )}
                <li><Calendar size={16} /> <span>Joined {joined}</span></li>
            </ul>

            {interests.length > 0 && (
                <div className="pf-block">
                    <h3>Interests</h3>
                    <div className="pf-chips">{interests.map((i) => <span key={i} className="pf-chip">{i}</span>)}</div>
                </div>
            )}

            {links.length > 0 && (
                <div className="pf-block">
                    <h3>Find me on</h3>
                    <div className="pf-chips">
                        {links.map((l) => (
                            <a key={l.platform} className="pf-chip link" href={safeHref(l.url)} target="_blank" rel="noopener noreferrer nofollow">
                                <LinkIcon size={13} /> {platformLabel(l.platform)}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* the server only sends the email to its owner, so other people never see it */}
            {isOwnProfile && user?.email && (
                <p className="pf-private"><Lock size={13} /> {user.email} <em>(only you can see this)</em></p>
            )}
            </div>
            )}
        </section>
    );
};

export default ProfileInfo;
