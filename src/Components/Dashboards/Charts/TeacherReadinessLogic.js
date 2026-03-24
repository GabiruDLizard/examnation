/**
 * Logic for calculating and managing teacher readiness chart data
 * Similar to ReadinessLogic.js but for multi-class teacher views
 */

// Calculate class-specific readiness progression over time
export function generateClassReadinessData(classes, studentsData, timeperiods = 8) {
  try {
    console.log('📊 Generating class readiness data...');
    console.log('Classes:', classes.map(c => c.name));
    console.log('Students:', studentsData.length);
    
    // Generate time periods (weeks/sessions)
    const periods = Array.from({ length: timeperiods }, (_, i) => `Week ${i + 1}`);
    
    // Generate chart data with realistic progression
    const chartData = periods.map((period, periodIndex) => {
      const dataPoint = { week: period };
      
      classes.forEach(classItem => {
        // Get students for this class
        const classStudents = studentsData.filter(s => s.className === classItem.name);
        
        if (classStudents.length > 0) {
          // Calculate base readiness for this class
          const baseReadiness = classStudents.reduce((sum, s) => sum + s.readiness, 0) / classStudents.length;
          
          // Add realistic time-based variation
          const timeProgression = calculateTimeProgression(periodIndex, timeperiods, baseReadiness);
          
          dataPoint[classItem.name] = Math.max(0, Math.min(100, Math.round(timeProgression)));
        } else {
          dataPoint[classItem.name] = 0;
        }
      });
      
      return dataPoint;
    });
    
    console.log('Generated chart data:', chartData);
    return chartData;
    
  } catch (error) {
    console.error('Error generating class readiness data:', error);
    return [];
  }
}

// Calculate time-based progression for readiness
function calculateTimeProgression(periodIndex, totalPeriods, baseReadiness) {
  // Factors affecting readiness over time:
  // 1. Natural learning curve (gradual improvement)
  // 2. Weekly variation (some weeks better than others)
  // 3. Fatigue/motivation cycles
  
  // Linear improvement over time (students generally get better)
  const learningGrowth = (periodIndex / totalPeriods) * 10; // Max 10% improvement
  
  // Weekly variation using sine wave (realistic ups and downs)
  const weeklyVariation = Math.sin(periodIndex / 2) * 3; // ±3% variation
  
  // Motivation cycles (every 3-4 weeks there might be a dip)
  const motivationCycle = Math.cos(periodIndex / 3) * 2; // ±2% motivation effect
  
  return baseReadiness + learningGrowth + weeklyVariation + motivationCycle;
}

// Generate color scheme for classes
export function generateClassColors(classes) {
  const colorPalette = [
    '#4ea8ff', // Blue
    '#10b981', // Green  
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Deep Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ];
  
  const classColors = {};
  classes.forEach((classItem, index) => {
    classColors[classItem.name] = colorPalette[index % colorPalette.length];
  });
  
  console.log('Generated class colors:', classColors);
  return classColors;
}

// Calculate aggregate statistics for teacher dashboard
export function calculateTeacherStats(classReadinessData) {
  if (!classReadinessData || classReadinessData.length === 0) {
    return {
      averageReadiness: 0,
      totalClasses: 0,
      improvementTrend: 0,
      topPerformingClass: null
    };
  }
  
  const latestWeek = classReadinessData[classReadinessData.length - 1];
  const firstWeek = classReadinessData[0];
  
  // Get all class names (excluding 'week' key)
  const classNames = Object.keys(latestWeek).filter(key => key !== 'week');
  const activeClasses = classNames.filter(name => latestWeek[name] > 0);
  
  // Calculate current average readiness
  const currentAverage = activeClasses.length > 0 
    ? activeClasses.reduce((sum, name) => sum + latestWeek[name], 0) / activeClasses.length 
    : 0;
    
  // Calculate improvement trend
  const firstAverage = activeClasses.length > 0 
    ? activeClasses.reduce((sum, name) => sum + (firstWeek[name] || 0), 0) / activeClasses.length 
    : 0;
  const improvementTrend = currentAverage - firstAverage;
  
  // Find top performing class
  const topPerformingClass = activeClasses.reduce((top, name) => 
    latestWeek[name] > (latestWeek[top] || 0) ? name : top, activeClasses[0]);
  
  return {
    averageReadiness: Math.round(currentAverage),
    totalClasses: activeClasses.length,
    improvementTrend: Math.round(improvementTrend * 10) / 10, // Round to 1 decimal
    topPerformingClass: topPerformingClass || null,
    topPerformingScore: topPerformingClass ? latestWeek[topPerformingClass] : 0
  };
}

