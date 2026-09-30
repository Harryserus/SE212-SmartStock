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


const createProduct = async(
	productName,
	barcode,
	unitPrice,
	categoryId
) => {
	const [result] = await db.query(`
		INSERT INTO PRODUCT
		(		
			ProductName,
			Barcode,
			UnitPrice,
			CategoryID
		)
		VALUES (?,?,?,?)
	`, [
		productName,
		barcode,
		unitPrice,
		categoryId
	   ]);

	return {
		productId: result.insertId,
		productName,
		barcode,
		unitPrice,
		categoryId
		};
};

const updateProduct = async(
	productId,
	productName,
	barcode,
	unitPrice,
	categoryId
) => {

	await db.query(`
		UPDATE PRODUCT
		SET
			ProductName = ?,
			Barcode = ?,
			UnitPrice = ?,
			CategoryID = ?,
		WHERE ProductID = ?
		`, [
			productName,
			barcode,
			unitPrice,
			categoryId,
			productId
		]);
		
	return {
		messsage : "Product update successfully"
	};
};
