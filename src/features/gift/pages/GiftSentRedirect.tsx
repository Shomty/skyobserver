import { Navigate, useParams } from 'react-router-dom';
import { isGiftSlug } from '../config/gifts';

/** Direct URL to /sent is not allowed — bounce back to the wizard. */
export default function GiftSentRedirect() {
  const { slug = '' } = useParams();
  if (!isGiftSlug(slug)) return <Navigate to="/gift" replace />;
  return <Navigate to={`/gift/${slug}`} replace />;
}
