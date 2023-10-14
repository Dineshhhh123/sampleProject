const { shortListCreators, creatorV2 } = require("../../database/mongo/models");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
class ShortListService { }


ShortListService.addCreatorsToList = async (filterquery, platformCreators) => {
    try {
        let filter = {...filterquery};
        delete filter.updatedBy;
        delete filter.companyDomain;
        const existingDocument = await shortListCreators.findOne(filter);
        console.log(existingDocument)
        if (existingDocument) {
            const update = { $addToSet: platformCreators };
            const options = { upsert: true, new: true };
            return await shortListCreators.findOneAndUpdate(filter, update, options);
        } else {
          // Document with the same _id doesn't exist, you can perform the findOneAndUpdate operation.
          const update = { $addToSet: platformCreators };
          const options = { upsert: true, new: true };
          return await shortListCreators.findOneAndUpdate(filterquery, update, options);
        }

    } catch (err) {
        console.log(err)
        throw new Error(err)
    }
}
ShortListService.removeCreatorsFromList = async (filterquery, removeCreators) => {
    try {
        const filter = filterquery;
        const update = { $pull: removeCreators};
        const options = { new: true };
        const result = await shortListCreators.findOneAndUpdate(filter, update, options);
        return result;
    } catch (err) {
        console.log(err)
        throw new Error(err)
    }
}

ShortListService.removeCreatorFromList = async (filterquery, removeCreator) => {
    try {
        const filter = filterquery;
        const update = {
            $pull: {
              instagram_creators: removeCreator,
              facebook_creators: removeCreator,
              youtube_creators: removeCreator,
            },
          };
        return  await shortListCreators.updateOne(filter, update);
       
    } catch (err) {
        console.log(err)
        throw new Error(err)
    }
}


ShortListService.createShortList = async (data) => {
    try {
        return await shortListCreators.create(data)
    } catch (err) {
        throw new Error(err)
    }
}


ShortListService.findOne = async (query) => {
    try {
        return await shortListCreators.findOne(query)
    } catch (err) {
        throw new Error(err)
    }
}



ShortListService.getAllShortList = async (filterquery) => {
    try {
        return await shortListCreators.find(filterquery, { shortListName: 1 }).sort({ createdAt: -1 })
    } catch (err) {
        throw new Error(err)
    }
}


ShortListService.getAllShortListWithCreatorsCount = async (userId) => {
    try {
       const result = await shortListCreators.aggregate([
            {
                $match: {
                  userId: ObjectId(userId),
                  shortListName: { $exists: true }
                }
            },
            {
                $sort: {
                  createdAt: -1 // Sort by createdAt field in descending order
                }
              },
            {
            $project: {
              shortListName: 1,
              totalCount: {
                $add: [
                    { $size: { $ifNull: ['$youtube_creators', []] } },
                    { $size: { $ifNull: ['$instagram_creators', []] } },
                    { $size: { $ifNull: ['$facebook_creators', []] } }
                  ]
              }
            }
          },
         
        ]);
          return result;
         
    } catch (err) {
        throw new Error(err)
    }
}

ShortListService.getCampShortListWithCreators = async(filterquery, offset, limit, sort, filterdata) => {
   
    try{
        return await shortListCreators.findOne(filterquery, {
            createdAt: 0,
            updatedAt:0,
            userId: 0,
            __v: 0,
          }).populate({
            path: 'creators',
            match: filterdata,
            options: {
              skip: offset,
              limit: limit,
              sort: sort
            }
          });
    }catch(err){
        throw new Error(err)
    }
}

ShortListService.getShortListWithCreators = async (filterquery, populatedFilterquery,offset, limit) => {
    try {
        const result = await shortListCreators.findOne(filterquery, {
            createdAt: 0,
            updatedAt: 0,
            userId: 0,
            __v: 0,
        }).populate({
            path: "instagram_creators",
            match: populatedFilterquery,
        }).populate({
            path: "youtube_creators",
            match: populatedFilterquery,
        }).populate({
            path: "facebook_creators",
            match: populatedFilterquery,
        }).lean();



        const instaCreatorsList = result?.instagram_creators ? result?.instagram_creators : [];
        const facebookCreatorsList = result?.facebook_creators ? result?.facebook_creators : [];
        const youtubeCreatorsList = result?.youtube_creators ? result?.youtube_creators : [];
        const instaCreators = instaCreatorsList.map(obj => ({ ...obj, "sl_platform": "instagram" }));
        const facebookCreators = facebookCreatorsList.map(obj => ({ ...obj, "sl_platform": "facebook" }));
        const youtubeCreators = youtubeCreatorsList.map(obj => ({ ...obj, "sl_platform": "youtube" }));
        let creators = [ ...instaCreators,...youtubeCreators,...facebookCreators].slice(offset, offset + limit);

        return { _id: result._id, shortListName: result?.shortListName ?  result?.shortListName: null , campaignId: result?.campaignId ?result?.campaignId: null,  creators: creators }
    } catch (err) {
        throw new Error(err)
    }
}


ShortListService.getShortListCountOfCreators = async (filterquery, populatedFilterquery) => {
    try {
        const result = await shortListCreators.findOne(filterquery, {
            createdAt: 0,
            updatedAt: 0,
            userId: 0,
            __v: 0,
        }).populate({
            path: "instagram_creators",
            match: populatedFilterquery,
        }).populate({
            path: "youtube_creators",
            match: populatedFilterquery,
        }).populate({
            path: "facebook_creators",
            match: populatedFilterquery,
        }).lean();

        const instaCreatorsLen = result?.instagram_creators ? result?.instagram_creators.length : 0;
        const facebookCreatorsLen = result?.facebook_creators ? result?.facebook_creators.length : 0;
        const youtubeCreatorsLen = result?.youtube_creators ? result?.youtube_creators.length : 0;

        return instaCreatorsLen + facebookCreatorsLen + youtubeCreatorsLen;


    } catch (err) {
        throw new Error(err)
    }

}


ShortListService.getTotalCountOfCreatorsInShortList = async (filterquery) => {

    try {
        const result = await shortListCreators.findOne(filterquery);
        if (result) {
            return result.creators.length;
        } else {
            return 0;
        }
    } catch (err) {
        throw new Error(err)
    }
}

ShortListService.getShortListById = async (shortlistId) => {
    try {
        console.log("Querying for shortlist with ID:", shortlistId);
        const shortlist = await shortListCreators.findById(shortlistId).lean();
        console.log("Shortlist found:", shortlist);
        return shortlist;
    } catch (error) {
        console.error("Error while fetching shortlist:", error);
        throw error;
    }
};


ShortListService.deleteShortList = async (_id) => {

    try {
        return await shortListCreators.findByIdAndDelete(_id)


    } catch (err) {
        throw new Error(err)
    }
}



// 
//SPRINT 6
ShortListService.getUniqueCreatorsIdCampaignId = async(campaignId) =>{
    try {
      // Find the shortlistcreators document by campaignId
      const slcreators = await shortListCreators.findOne({ campaignId });
  
      if (!slcreators) {
        console.log('No matching shortlistcreators found for the campaign ID.');
        return [];
      }
      // Extract Instagram, Facebook, and YouTube creator IDs from the shortlistcreators document
      const instagramCreatorIds = slcreators.instagram_creators.map(creator => creator._id);
      const facebookCreatorIds = slcreators.facebook_creators.map(creator => creator._id);
      const youtubeCreatorIds = slcreators.youtube_creators.map(creator => creator._id);
  
      // Combine all creator IDs into a single array while ensuring uniqueness
      const allCreatorIds = [...new Set([...instagramCreatorIds, ...facebookCreatorIds, ...youtubeCreatorIds])];
      return allCreatorIds;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

ShortListService.getCreatorsByCampaignId = async(campaignId) =>{
    try {
      // Find the shortlistcreators document by campaignId
      const slcreators = await shortListCreators.findOne({ campaignId });
  
      if (!slcreators) {
        console.log('No matching shortlistcreators found for the campaign ID.');
        return [];
      }
  
      // Extract Instagram, Facebook, and YouTube creator IDs from the shortlistcreators document
      const instagramCreatorIds = slcreators.instagram_creators.map(creator => creator._id);
      const facebookCreatorIds = slcreators.facebook_creators.map(creator => creator._id);
      const youtubeCreatorIds = slcreators.youtube_creators.map(creator => creator._id);
  
      // Combine all creator IDs into a single array while ensuring uniqueness
      const allCreatorIds = [...new Set([...instagramCreatorIds, ...facebookCreatorIds, ...youtubeCreatorIds])];
  
      // Fetch data for each creator from creatorsV2
      const creatorsData = await creatorV2.find({ _id: { $in: allCreatorIds } },{_id:1,creator_name:1,modashThumbnail:1,thumbnailURL:1 });
  
      return creatorsData;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
module.exports = ShortListService;