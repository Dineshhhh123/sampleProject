const { campManagmentCreators } = require("../../database/mongo/models");

const mgmtCreatorService = {}

mgmtCreatorService.getCreatorsByCampaignId = async (campaignId,limit, offset) => {

    try {
        return await campManagmentCreators.find({ campaignId: campaignId }).skip(offset).limit(limit).populate({
            path: 'creator',
            model: 'creatorV2', // Specify the model to populate from
            select: '_id creator_name modashThumbnail thumbnailURL Instagram_handle Facebook_Username YT_Username', // Projection to include only the desired fields
            options: { virtuals: false }, // Projection to include only field1
          });
    } catch (error) {
        throw new Error(error)
        console.error('Error:', error);
    }

}


mgmtCreatorService.getCreatorsByCampaignIdCount = async (campaignId) => {

    try {
        return await campManagmentCreators.count({ campaignId: campaignId });
    } catch (error) {
        throw new Error(error)
        console.error('Error:', error);
    }

}



mgmtCreatorService.getSingleCreatorFromCampaign = async (filter) => {

    try {
        return await campManagmentCreators.findOne(filter);
    } catch (error) {
        throw new Error(error)
    }

}

mgmtCreatorService.updateCreatorStatus = async (filter, updateData) => {
        console.log(filter, updateData)
    try {
        return await campManagmentCreators.findOneAndUpdate(filter,updateData, {new:true});
    } catch (error) {
        throw new Error(error)
    }

}


mgmtCreatorService.bulkCreation = async (documentsToInsert, campaignId) => {

    try {
        // Check if any of the documents already exist by querying the collection
        let existingDocs = await campManagmentCreators.find({ creatorId: { $in: documentsToInsert.map(doc => doc.creatorId) }, campaignId: campaignId });
        // Filter the documents to insert based on which ones don't already exist
        existingDocs = JSON.parse(JSON.stringify(existingDocs))
        const newDocumentsToInsert = documentsToInsert.filter(doc => !existingDocs.some(existingDoc => existingDoc.creatorId == doc.creatorId));
        if (newDocumentsToInsert.length === 0) {
            console.log('No new documents to insert.');
            return;
        }

        // Insert the new documents
        return await campManagmentCreators.insertMany(newDocumentsToInsert);
    } catch (error) {
        console.error('Error:', error);
    }


    // try{
    //     campManagmentCreators.insertMany(data)
    // }catch(err){
    //     throw new Error(err)
    // }
}






module.exports = mgmtCreatorService
