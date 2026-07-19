import API from "./api";

export const getCompetitorsByProduct = async (productId) => {
    const response = await API.get(
        `/opportunities/product/${productId}/competitors`
    );

    return response.data;
};

export const getSelectedCompetitors = async (
    opportunityId,
    productId
) => {
    const response = await API.get(
        `/opportunities/${opportunityId}/products/${productId}/competitors`
    );

    return response.data;
};

export const saveCompetitors = async (
    opportunityId,
    productId,
    competitorIds
) => {
    return API.put(
        `/opportunities/${opportunityId}/products/${productId}/competitors`,
        {
            competitor_product_ids: competitorIds,
        }
    );
};