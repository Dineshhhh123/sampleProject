const { collabs } = require("../../database/mongo/models");
const { statusCodes, messages } = require("./../../configs");
const getPagingData = require('../../utils/pagination');
const { platformPosition } = require('../../constants');
const creatorService = require("./creator.service");

class VideosService { }

VideosService.bulkAddCollabsData = async (data) => {
    try {
        let finalData = data;
        let createCount = 0;
        for (const item of finalData) {
            console.log("item", item);
            let prepareBody = {
                thumbnail_url: item.thumbnail_url,
                video_title: item.video_title,
                video_url: item.social_media_url,
                platform: item.platform,
                sponsorInfo: {
                    sponsorTitle: item.partner_info[0].partner_title ? item.partner_info[0].partner_title : "",
                    sponsorContentCategory: item.partner_info[0].partner_content_category ? item.partner_info[0].partner_content_category : "",
                    sponsorCountry: item.partner_info[0].partner_country ? item.partner_info[0].partner_country : ""
                },
                creatorInfo: {
                    creatorTitle: item.partner_info[1].partner_title ? item.partner_info[1].partner_title : "",
                    creatorContentCategory: item.partner_info[1].partner_content_category ? item.partner_info[1].partner_content_category : "",
                    creatorCountry: item.partner_info[1].partner_country ? item.partner_info[1].partner_country : ""
                },
                position: platformPosition(item.platform.toLowerCase())
            }
            let createCollabs = await collabs.create(prepareBody);
            if (createCollabs) {
                createCount++;
            }
        }
        return {
            status: statusCodes.HTTP_OK,
            message: 'Collabs data added successfully',
            data: {
                createCount: createCount
            }
        }
    } catch (err) {
        throw new Error(err);
    }
}

VideosService.getCollabsData = async (data) => {
    try {
        let { productCategory, creatorGenre, brand, creatorName, page, size } = data;
        page = Number(page);
        let limit = Number(size);
        let offset = (page - 1) * limit;
        let limitQuery = limit * page;
        let query = {};
        console.log(typeof creatorName);
        if (productCategory) query["sponsorInfo.sponsorContentCategory"] = { $in: productCategory };
        if (creatorGenre) query["creatorInfo.creatorContentCategory"] = { $in: creatorGenre };
        if (brand) query["sponsorInfo.sponsorTitle"] = { $in: brand };
        if (creatorName) query["creatorInfo.creatorTitle"] = { $in: creatorName };
        console.log("This is the final query", query);
        let totalCount = await collabs.countDocuments(query);
        let getAllCollabsData = await collabs.aggregate([
            { $match: query },
            { $sort: { position: 1, _id: 1 } },
            { $limit: limitQuery },
            { $skip: offset }
        ])
        console.log("getAllCollabsData", getAllCollabsData);

        let response = [];
        for( let item of getAllCollabsData){
            const getCollapse = await creatorService.getCollapseImagesData(item.sponsorInfo.sponsorTitle);
            if(getCollapse){
                item.sponsorInfo['brandImage'] = getCollapse.brandCollaboratorImagesURL
            }else{
                item.sponsorInfo['brandImage'] = null
            }
            response.push(item)
        }
 
        let getPaging = getPagingData(response, page, limit, totalCount);
        if (!getAllCollabsData) return {
            status: statusCodes.HTTP_BAD_REQUEST,
            message: 'No Collabs data found',
        }
        return {
            status: statusCodes.HTTP_OK,
            message: 'Collabs data found',
            data: getPaging
        }
    } catch (err) {
        throw new Error(err);
    }
}

VideosService.getCollabsFilterData = async (data) => {
    try {
        let { productCategory, creatorGenre, brand, creatorName, primarySelection, secondarySelection, thirdSelection, fourthSelection } = data;
        let query = {};
        if (productCategory) query["sponsorInfo.sponsorContentCategory"] = { $in: productCategory };
        if (creatorGenre) query["creatorInfo.creatorContentCategory"] = { $in: creatorGenre };
        if (brand) query["sponsorInfo.sponsorTitle"] = { $in: brand };
        if (creatorName) query["creatorInfo.creatorTitle"] = { $in: creatorName };

        let productCategoryArray = await collabs.distinct("sponsorInfo.sponsorContentCategory", query);
        let creatorGenreArray = await collabs.distinct("creatorInfo.creatorContentCategory", query);
        let brandArray = await collabs.distinct("sponsorInfo.sponsorTitle", query);
        let creatorNameArray = await collabs.distinct("creatorInfo.creatorTitle", query);

        let productCategoryRemaining = [];
        let creatorGenreremaining = [];
        let brandremaining = [];
        let creatorNameRemaining = [];

        if (primarySelection === "productCategory" || secondarySelection === "productCategory" || thirdSelection === "productCategory" || fourthSelection === "productCategory" ) {
            let query = {
                "sponsorInfo.sponsorContentCategory": { $nin: productCategoryArray }
            }
            if (secondarySelection === "productCategory" || thirdSelection === "productCategory" || fourthSelection === "productCategory"  ) {
                if (creatorGenre) query["creatorInfo.creatorContentCategory"] = { $in: creatorGenre };
                if (brand) query["sponsorInfo.sponsorTitle"] = { $in: brand };
                if (creatorName) query["creatorInfo.creatorTitle"] = { $in: creatorName };
            }
            productCategoryRemaining = await collabs.distinct("sponsorInfo.sponsorContentCategory", query);
        }
        if (primarySelection === "creatorGenre" || secondarySelection === "creatorGenre" || thirdSelection === "creatorGenre" || fourthSelection === "creatorGenre" ) {
            let query = {
                "creatorInfo.creatorContentCategory": { $nin: creatorGenreArray }
            }
            if (secondarySelection === "creatorGenre" || thirdSelection === "creatorGenre" || fourthSelection === "creatorGenre" ) {
                if (productCategory) query["sponsorInfo.sponsorContentCategory"] = { $in: productCategory };
                if (brand) query["sponsorInfo.sponsorTitle"] = { $in: brand };
                if (creatorName) query["creatorInfo.creatorTitle"] = { $in: creatorName };
            }
            creatorGenreremaining = await collabs.distinct("creatorInfo.creatorContentCategory", query);
        }
        if (primarySelection === "brand" || secondarySelection === "brand" || thirdSelection === "brand" || fourthSelection === "brand" ) {
            let query = {
                "sponsorInfo.sponsorTitle": { $nin: brandArray }
            }
            if (secondarySelection === "brand" || thirdSelection === "brand" || fourthSelection === "brand" ) {
                if (productCategory) query["sponsorInfo.sponsorContentCategory"] = { $in: productCategory };
                if (creatorGenre) query["creatorInfo.creatorContentCategory"] = { $in: creatorGenre };
                if (creatorName) query["creatorInfo.creatorTitle"] = { $in: creatorName };
            }
            brandremaining = await collabs.distinct("sponsorInfo.sponsorTitle", query);
        }
       
        if (primarySelection === "creatorName" || secondarySelection === "creatorName" || thirdSelection === "creatorName" || fourthSelection === "creatorName" ) {
            let query = {
                "creatorInfo.creatorTitle": { $nin: creatorNameArray }
            }
            if (secondarySelection === "creatorName" || thirdSelection === "creatorName" || fourthSelection === "creatorName" ) {
                if (productCategory) query["sponsorInfo.sponsorContentCategory"] = { $in: productCategory };
                if (creatorGenre) query["creatorInfo.creatorContentCategory"] = { $in: creatorGenre };
                if (brand) query["sponsorInfo.sponsorTitle"] = { $in: brand };
            }
            creatorNameRemaining = await collabs.distinct("creatorInfo.creatorTitle", query);
        }

        let finalData = {
            productCategory: productCategoryArray,
            creatorGenre: creatorGenreArray,
            brand: brandArray,
            creatorName: creatorNameArray,
            productCategoryRemaining,
            creatorGenreremaining,
            brandremaining,
            creatorNameRemaining
        }
        return {
            status: statusCodes.HTTP_OK,
            message: 'Filter data found',
            data: finalData
        }
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = VideosService;