const db = require("../config/db");

const getAllProducts = async () => {
	const [rows] = await db.query (`
		SELECT
			ProductID,
			ProductName,
			Barcode,
			UnitPrice,
			CategoryID
		FROM PRODUCT`);
	return rows;
};

const getProductById = async (productId) => {
	const [rows] = await db.query (`
		SELECT
			ProductID,
			ProductName,
			Barcode,
			UnitPrice,
			CategoryID
		FROM PRODUCT
		WHERE ProductID = ?
		`, [productId]);
	return rows[0];
});


const createProduct = async
