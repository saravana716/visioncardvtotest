import React, { useState, useEffect } from 'react'
import "./ContactLens.css"
import { getCategoryByName } from '../../services/firestoreService'
import { useNavigate } from 'react-router-dom'

const ContactLens = () => {
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubcategories = async () => {
            const categoryData = await getCategoryByName('Contact Lenses');
            if (categoryData && categoryData.subcategories) {
                setSubcategories(categoryData.subcategories);
            }
            setLoading(false);
        };
        fetchSubcategories();
    }, []);

    if (loading) {
        return <div className='contact' style={{justifyContent: 'center', color: 'white'}}>Loading contact lenses...</div>;
    }

    return (
        <div className='contact'>
            <div className='discoverleft'>
                <button onClick={() => navigate('/products?category=Contact Lenses')}>Shop Now</button>
            </div>
            <div className='discoverright'>
                {subcategories.map((data, index) => (
                    <div 
                        className='DiscoverCard' 
                        key={data.id || index} 
                        style={{cursor: 'pointer'}}
                        onClick={() => navigate(`/products?category=Contact Lenses&subcategory=${encodeURIComponent(data.name)}`)}
                    >
                        <div className='cardimg'>
                            <img src={data.imageUrl} alt={data.name} />
                        </div>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products?category=Contact Lenses&subcategory=${encodeURIComponent(data.name)}`);
                        }}>{data.name}</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ContactLens