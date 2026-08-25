export interface Business {
  id?: string;
  ownerId: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
