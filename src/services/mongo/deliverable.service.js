const { addDeliverable, deliverableHistory } = require("../../database/mongo/models");

const deliverableService = {};


deliverableService.createDeliverables = async(arrayOfData) =>{
    return await addDeliverable.insertMany(arrayOfData)
}


deliverableService.getDeliverables = async(filter,limit,offset) =>{
    try{
        return await addDeliverable.find(filter).skip(offset).limit(limit);
    }catch(err){
        throw new Error(err)
    }
    
}

deliverableService.countDocument = async(filter) =>{
    try{
        return await addDeliverable.count(filter);
    }catch(err){
        throw new Error(err)
    }
    
}

deliverableService.updateDeliverables = async(filter,data) =>{
    try{
        return await addDeliverable.findOneAndUpdate(filter, data, {new:true})
    }catch(err){
        console.log(err);
        throw new Error(err)
    }
   
}

deliverableService.insertDeliverableHistory =  async (data) =>{
    try{
        return await deliverableHistory.create(data)
    }catch(err){
        throw new Error(err)
    }
}

module.exports = deliverableService;