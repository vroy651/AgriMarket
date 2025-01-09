
import { Link } from 'react-router-dom';
import "./styles/CategorySidebar.css";

const CategorySidebar = () => {
  const categories = [
    { id: 1, name: 'Fresh Produce', path: '/categories/fresh-produce' },
    { id: 2, name: 'Seeds & Plants', path: '/categories/seeds-plants' },
    { id: 3, name: 'Tools & Equipment', path: '/categories/tools-equipment' },
    { id: 4, name: 'Fertilizers', path: '/categories/fertilizers' },
    { id: 5, name: 'Pesticides', path: '/categories/pesticides' },
  ];

  return (
    <div className="category-sidebar">
      <h3>Categories</h3>
      <ul>
        {categories.map(category => (
          <li key={category.id}>
            <Link to={category.path}>{category.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategorySidebar;