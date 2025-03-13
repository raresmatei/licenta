// seedProductsFromFolder.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

console.log('env: ', process.env)

const baseUrl = process.env.BASE_URL || 'http://localhost:8888/.netlify/functions';
const token = process.env.TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImFkbWluIjp0cnVlLCJ1c2VySWQiOiJhZG1pbklkIiwiaWF0IjoxNzQxMzU5NDIyLCJleHAiOjE3NDEzNjMwMjJ9.S66BmQtloPfB2eEeEyWJErvytwmeevbBbLBzAWqP9i8';
const testDataFolder = path.join(__dirname, 'test-data');

// Helper: create a product name from the filename
const createProductName = (filename) => {
    const name = path.basename(filename, path.extname(filename));
    // Replace underscores/hyphens with spaces and capitalize first letter
    return name.replace(/[_-]/g, ' ').replace(/^\w/, c => c.toUpperCase());
};

const createProductData = (filename) => {
    const name = createProductName(filename);
    const price = (Math.random() * 50 + 10).toFixed(2); // random price between 10 and 60
    const category = 'Cosmetics';
    const brand = 'TestBrand';
    const description = `This is the ${name} product.`;
    return { name, price, category, brand, description };
};

const seedProducts = async () => {
    try {
        // Read all files in testData folder with valid image extensions
        const files = fs.readdirSync(testDataFolder).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        });

        for (const file of files) {
            const filePath = path.join(testDataFolder, file);
            const productData = createProductData(file);

            // Build FormData payload
            const formData = new FormData();
            formData.append('name', productData.name);
            formData.append('price', productData.price);
            formData.append('description', productData.description);
            formData.append('category', productData.category);
            formData.append('brand', productData.brand);
            // Append file stream (as the 'images' field)
            formData.append('images', fs.createReadStream(filePath));

            console.log(`Uploading product: ${productData.name}`);

            const response = await axios.post(`${baseUrl}/products`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...formData.getHeaders(),
                }
            });

            console.log(`Uploaded product: ${response.data.product.name}`);
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding products:', err);
        process.exit(1);
    }
};

seedProducts();
