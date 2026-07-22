import React, { useState, useEffect } from 'react'
import "./Discover.css"
import discoverimg from "../../assets/discoverimg.png"
import { getCategories } from '../../services/firestoreService'
import { useNavigate } from 'react-router-dom'

const Discover = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategoriesData = async () => {
            const data = await getCategories();
            setCategories(data);
            setLoading(false);
        };
        fetchCategoriesData();
    }, []);

    if (loading) {
        return <div className='discover' style={{justifyContent: 'center'}}>Loading categories...</div>;
    }

    if (categories.length === 0) {
        return null;
    }

    // Duplicate list for infinite scroll effect
    const extendedList = [...categories, ...categories];

    return (
        <div className='discover'>
            <div className='discoverleft'>
                <h1>Discover</h1>
                <h1>Frames <img src={discoverimg} alt="Discover" /></h1>
                <h1>By Category</h1>
            </div>
            <div className='discoverright'>
                <div className='carousel-track'>
                    {extendedList.map((data, index) => (
                        <div 
                            className='DiscoverCard' 
                            key={`${data.id}-${index}`} 
                            onClick={() => navigate(`/products?category=${data.name}`)}
                        > 
                            <div className='cardimg'>
                                <img src={data.imageUrl || data.img} alt={data.name} loading="lazy" decoding="async" />
                            </div>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/products?category=${data.name}`);
                            }}>{data.name}</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Discover