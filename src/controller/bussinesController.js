require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Business = require('../models/bussinessSchema')
const Item = require('../models/businessItemSchema')

class businessController {
    register = async (req, res) => {
        const { name, mobileName, email, companyName, companyCategory, password } = req.body;

        try {
            const existingUser = await Business.findOne({ email });

            if (existingUser) {
                return res.status(409).json({ message: 'User already exists' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log(hashedPassword);

            const bussinessUser = new Business({ name, mobileName, email, companyName, companyCategory, password: hashedPassword, });
            await bussinessUser.save();
            res.status(201).json({ bussinessUser, message: 'bussiness registered successfully' });
        } catch (error) {
            res.status(500).json([{ message: "internal server" }, { error }])
        }
    }

    login = async (req, res) => {
        const { email, password } = req.body;

        try {
            const business = await Business.findOne({ email });
            if (!business) {
                return res.status(401).json({ message: 'you are not registered' });
            }

            const isPasswordValid = await bcrypt.compare(password, business.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Authentication failed' });
            }

            const token = jwt.sign({ businessId: business._id }, process.env.BUSINESS_KEY);

            res.json({ token });
        } catch (error) {
            res.status(500).json([{ message: "internal server" }, { error }])
        }
    };
    addFoundItem = async (req, res) => {
        const itemData = req.body;
        const { businessId } = req;
        try {

            const existingItem = await Item.findOne({ itemName: itemData.itemName });
            const business = await Business.findOne({businessId})
            console.log(business)
            console.log(existingItem)
            if (existingItem) {
                return res.status(409).json({ message: 'Item already added' });
            }
            const newItem = new Item({
                user: businessId,
                itemName: itemData.itemName,
                itemCategory: itemData.itemCategory,
                itemDescription: itemData.itemDescription,
                keywords: itemData.keywords,
                location: itemData.location,
                locationIdentifiers: itemData.locationIdentifiers,
                businessName: itemData.businessName,
                businessPhoneNumber: itemData.businessPhoneNumber,
                businessEmail: itemData.businessEmail
            });
            const datavalues = await newItem.save();
            res.status(500).json([{ message: "added successfully" }, { datavalues }])


        } catch (error) {
            res.status(500).json([{ message: "internal server" }, { error }])
        }
    }


}
module.exports = new businessController();
