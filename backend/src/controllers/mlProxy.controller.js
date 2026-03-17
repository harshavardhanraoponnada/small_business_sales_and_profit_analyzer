const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

const proxyRequest = async (req, res, path, options = {}) => {
  try {
    const url = `${ML_SERVICE_URL}${path}`;
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `ML service error: ${error.message}`
    });
  }
};

exports.getSummary = async (req, res) => {
  const { periods = 30 } = req.query;
  return proxyRequest(req, res, `/api/predictions/summary?periods=${periods}`);
};

exports.getForecast = async (req, res) => {
  const { type } = req.params;
  const { periods = 30 } = req.query;
  return proxyRequest(req, res, `/api/predictions/forecast/${type}?periods=${periods}`);
};

exports.trainModels = async (req, res) => {
  return proxyRequest(req, res, "/api/predictions/train", { method: "POST", body: {} });
};

exports.evaluateModel = async (req, res) => {
  const { type } = req.params;
  return proxyRequest(req, res, `/api/predictions/evaluate/${type}`);
};
