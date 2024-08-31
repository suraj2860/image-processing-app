import Request from '../models/request.model.js';

const checkStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findOne({ requestId });

    if (!request) {
      return res.status(404).json({ error: 'Request ID not found' });
    }

    res.status(200).json({ status: request.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve status' });
  }
};

export { checkStatus };
