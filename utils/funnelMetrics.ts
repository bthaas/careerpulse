import { Application } from '../types';
import { FunnelStage } from '../FunnelTypes';
import { mapStatusToStage } from './funnelDataTransform';

/**
 * Pipeline metrics calculated from application data
 */
export interface PipelineMetrics {
  totalApplications: number;
  responseRate: number;      // % that moved beyond "Applied"
  interviewRate: number;      // % that reached "Interview"
  offerRate: number;          // % that reached "Offer"
}

/**
 * Calculates pipeline metrics from application data.
 * All percentages are rounded to one decimal place.
 * 
 * @param applications - Array of applications to analyze
 * @returns Pipeline metrics object
 */
export function calculatePipelineMetrics(applications: Application[]): PipelineMetrics {
  const total = applications.length;
  
  if (total === 0) {
    return {
      totalApplications: 0,
      responseRate: 0.0,
      interviewRate: 0.0,
      offerRate: 0.0
    };
  }
  
  // Count applications by stage
  let appliedCount = 0;
  let interviewCount = 0;
  let offerCount = 0;
  
  for (const app of applications) {
    const stage = mapStatusToStage(app.status);
    
    if (stage === FunnelStage.APPLIED) {
      appliedCount++;
    } else if (stage === FunnelStage.INTERVIEW) {
      interviewCount++;
    } else if (stage === FunnelStage.OFFER) {
      offerCount++;
    }
  }
  
  // Calculate rates
  // Response rate = applications that moved beyond "Applied"
  const respondedCount = total - appliedCount;
  const responseRate = (respondedCount / total) * 100;
  
  // Interview rate = applications that reached "Interview" stage
  const interviewRate = (interviewCount / total) * 100;
  
  // Offer rate = applications that reached "Offer" stage
  const offerRate = (offerCount / total) * 100;
  
  return {
    totalApplications: total,
    responseRate: Math.round(responseRate * 10) / 10,  // Round to 1 decimal
    interviewRate: Math.round(interviewRate * 10) / 10,
    offerRate: Math.round(offerRate * 10) / 10
  };
}
