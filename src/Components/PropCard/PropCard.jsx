import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import "./PropCard.css"

const PropCard = ({ cardlist }) => {
    const navigate = useNavigate();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { addItemToCart } = useCart();
    
    if (!cardlist) return null;
    
    return (
        <>
            {cardlist.map((data) => (
                <div 
                    className='propcard' 
                    key={data.id} 
                    onClick={() => navigate(`/product/${data.id}`)}
                >
                    <div className='propcardimg'>
                        {data.tryOn && <div className="tryon-tag">3D Try-On</div>}
                        <div className={`img-wrapper ${data.hoverImg ? 'has-hover' : ''}`}>
                            {data.img ? (
                                <img
                                    src={data.img}
                                    alt={data.title}
                                    className='main-product-img'
                                    loading="lazy"
                                    decoding="async"
                                    style={{ viewTransitionName: `product-img-${data.id}` }}
                                />
                            ) : (
                                <div className="main-product-img placeholder-img"></div>
                            )}

                            {data.hoverImg && (
                                <img
                                    src={data.hoverImg}
                                    alt={`${data.title} hover`}
                                    className='hover-product-img'
                                    loading="lazy"
                                    decoding="async"
                                />
                            )}
                        </div>
                        
                        <button
                            type="button"
                            className={`heart-container ${isInWishlist(data.id) ? 'active' : ''}`}
                            aria-label={isInWishlist(data.id) ? `Remove ${data.title} from wishlist` : `Add ${data.title} to wishlist`}
                            aria-pressed={isInWishlist(data.id)}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(data.id);
                            }}
                        >
                            {isInWishlist(data.id) ? <FaHeart className='hearticon' aria-hidden="true" /> : <FaRegHeart className='hearticon' aria-hidden="true" />}
                        </button>

                    </div>

                    <div className='propcontent'>

                        <h5 className="product-title">{data.title}</h5>

                        <div className='product-footer'>
                            <div className="product-pricing">
                                <span className="current-price">{data.price}</span>
                                <span className="old-price">{data.mrpprice}</span>
                            </div>
                            {/* <div className="product-variants">
                                {data.color && <img src={data.color} alt="colors" className="color-dots" />}
                                <span className="variant-count">{data.colorcount} +</span>
                            </div> */}
                        </div>
                        <div className="product-actions">
                            <button className='btn-add' onClick={async (e) => {
                                e.stopPropagation();
                                const cartData = {
                                    productId: data.id,
                                    productBrand: data.brand || 'Visionkart',
                                    productName: data.title,
                                    productImage: data.img || '',
                                    productPrice: data.price,
                                    totalPrice: data.price,
                                    specifications: [
                                        { label: 'Lens', value: 'Frame Only' },
                                        { label: 'Material', value: 'Standard' }
                                    ],
                                    sku: data.id,
                                };
                                const success = await addItemToCart(cartData);
                                if (success) {
                                    navigate('/cart');
                                }
                            }}>Add to Cart</button>
                            <button className='btn-view' onClick={(e) => {
                                e.stopPropagation();
                                const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                                const updated = [data.id, ...viewed.filter(vId => vId !== data.id)].slice(0, 10);
                                localStorage.setItem('recentlyViewed', JSON.stringify(updated));
                                navigate(`/product/${data.id}`);
                            }}>View</button>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}

export default PropCard