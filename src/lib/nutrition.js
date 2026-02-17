/**
 * Mifflin-St Jeor Equation & Macro Calculation
 * This is the engine that drives your daily calorie/macro goals.
 */

export const calculateTargets = (weightKg, heightCm, age, gender, activityLevel = 1.2, goal = 'maintain') => {
  // 1. Calculate Basal Metabolic Rate (BMR)
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  
  // Sex modifier: +5 for males, -161 for females
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;

  // 2. Adjust for Activity Level (TDEE)
  // 1.2 = Sedentary, 1.375 = Lightly Active, 1.55 = Moderately Active, 1.725 = Very Active
  const tdee = Math.round(bmr * activityLevel);

  // 3. Adjust for Goal
  let targetCalories = tdee;
  if (goal === 'lose') targetCalories -= 500; // Standard 1lb/week loss
  if (goal === 'gain') targetCalories += 500; // Standard muscle building surplus

  // 4. Macro Split (Recommended: 30% Protein, 40% Carbs, 30% Fats)
  // 1g Protein = 4 cal, 1g Carbs = 4 cal, 1g Fat = 9 cal
  return {
    calories: targetCalories,
    protein: Math.round((targetCalories * 0.30) / 4),
    carbs: Math.round((targetCalories * 0.40) / 4),
    fats: Math.round((targetCalories * 0.30) / 9),
    updatedAt: new Date().toISOString()
  };
};

// Conversion Helpers
export const lbsToKg = (lbs) => lbs * 0.453592;
export const ftInToCm = (ft, inches) => (ft * 30.48) + (inches * 2.54);