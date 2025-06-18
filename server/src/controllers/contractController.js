const contractService = require('../services/contractService');

const contractController = {
  createContract: async (req, res) => {
    const result = await contractService.createContract(req.body, req.user);
    return res.status(result.success ? 200 : 400).json(result);
  },

  getContractsByStatus: async (req, res) => {
    const { status, page, limit } = req.query;
    const result = await contractService.getContractsByStatus(status, page, limit);
    return res.status(200).json(result);
  },

  getContractsByCreator: async (req, res) => {
    const { status, page, limit } = req.query;
    const result = await contractService.getContractsByCreator(req.user.userId, status, page, limit);
    return res.status(200).json(result);
  },

  updateContractStatus: async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await contractService.updateContractStatus(id, status, req.user);
    return res.status(result.success ? 200 : 403).json(result);
  },

  deleteContract: async (req, res) => {
    const { id } = req.params;
    const result = await contractService.deleteContract(id, req.user);
    return res.status(result.success ? 200 : 403).json(result);
  },

  getContractById: async (req, res) => {
    const { id } = req.params;
    const result = await contractService.getContractById(id);
    return res.status(result.success ? 200 : 404).json(result);
  }
};

module.exports = contractController;