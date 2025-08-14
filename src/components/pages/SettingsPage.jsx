import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { studentService } from "@/services/api/studentService";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Label from "@/components/atoms/Label";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
const SettingsPage = () => {
  const [categories, setCategories] = useState({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryWeight, setNewCategoryWeight] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingWeight, setEditingWeight] = useState(0);

  const totalWeight = Object.values(categories).reduce((sum, weight) => sum + weight, 0);

  useEffect(() => {
    // Load current category weights
    const currentWeights = studentService.getCategoryWeights();
    setCategories(currentWeights);
  }, []);

  // Helper functions
  function handleEditCategory(name, weight) {
    setEditingCategory(name);
    setEditingName(name);
    setEditingWeight(weight);
  }

  function handleCancelEdit() {
    setEditingCategory(null);
    setEditingName('');
    setEditingWeight(0);
  }

  function handleSaveEdit() {
    if (!editingName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    if (editingName !== editingCategory && categories[editingName]) {
      toast.error('Category name already exists');
      return;
    }

    const newCategories = { ...categories };
    
    if (editingName !== editingCategory) {
      delete newCategories[editingCategory];
    }
    
    newCategories[editingName] = editingWeight;
    setCategories(newCategories);
    
    setEditingCategory(null);
    setEditingName('');
    setEditingWeight(0);
    
    toast.success('Category updated successfully');
  }

  function handleAddCategory() {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (categories[newCategoryName]) {
      toast.error('Category already exists');
      return;
    }

    setCategories(prev => ({
      ...prev,
      [newCategoryName]: newCategoryWeight
    }));

    setNewCategoryName('');
    setNewCategoryWeight(0);
    setIsAddingCategory(false);
    
    toast.success(`Category "${newCategoryName}" added successfully`);
  }

  function handleDeleteCategory(name) {
    if (Object.keys(categories).length <= 1) {
      toast.error('Cannot delete the last category');
      return;
    }

    const newCategories = { ...categories };
    delete newCategories[name];
    setCategories(newCategories);
    
    toast.success(`Category "${name}" deleted successfully`);
  }

  async function handleSaveSettings() {
    try {
      await studentService.setCategoryWeights(categories);
      toast.success('Category settings saved successfully! Changes will apply to all grade calculations.');
    } catch (error) {
      toast.error('Failed to save settings. Please try again.');
      console.error('Error saving category settings:', error);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-slate-600 font-medium mt-2">
          Configure your gradebook preferences and application settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Grade Categories Manager */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-3 rounded-xl">
                  <ApperIcon name="Scale" className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Grade Categories</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    Manage assignment types and their weights for grade calculations
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-2"
                variant="primary"
              >
                <ApperIcon name="Plus" size={16} />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {Object.entries(categories).map(([name, weight]) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                      {editingCategory === name ? (
                        <div className="flex items-center gap-3 flex-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Category name"
                            className="max-w-48"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editingWeight}
                              onChange={(e) => setEditingWeight(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                              className="w-20 text-center"
                            />
                            <span className="text-sm font-medium text-slate-600">%</span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              onClick={handleSaveEdit}
                              variant="success"
                              size="sm"
                            >
                              <ApperIcon name="Check" size={14} />
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              variant="secondary"
                              size="sm"
                            >
                              <ApperIcon name="X" size={14} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-900">{name}</span>
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-2xl font-bold text-primary-600">{weight}%</span>
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden ml-3">
                              <div 
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                                style={{ width: `${weight}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              onClick={() => handleEditCategory(name, weight)}
                              variant="secondary"
                              size="sm"
                            >
                              <ApperIcon name="Edit" size={14} />
                            </Button>
                            <Button
                              onClick={() => handleDeleteCategory(name)}
                              variant="error"
                              size="sm"
                            >
                              <ApperIcon name="Trash2" size={14} />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add new category form */}
              <AnimatePresence>
                {isAddingCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-primary-50 rounded-lg border-2 border-dashed border-primary-200"
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name (e.g., Lab Work)"
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={newCategoryWeight}
                          onChange={(e) => setNewCategoryWeight(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          placeholder="Weight"
                          className="w-20 text-center"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        />
                        <span className="text-sm font-medium text-slate-600">%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleAddCategory}
                          variant="primary"
                          size="sm"
                          disabled={!newCategoryName.trim()}
                        >
                          <ApperIcon name="Plus" size={14} />
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategoryName('');
                            setNewCategoryWeight(0);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          <ApperIcon name="X" size={14} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Weight total and validation */}
              <div className="p-4 bg-slate-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Total Weight:</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${
                      totalWeight === 100 ? 'text-success-600' : 
                      totalWeight < 100 ? 'text-warning-600' : 'text-error-600'
                    }`}>
                      {totalWeight}%
                    </span>
                    {totalWeight === 100 ? (
                      <ApperIcon name="CheckCircle" className="h-5 w-5 text-success-500" />
                    ) : (
                      <ApperIcon name="AlertCircle" className="h-5 w-5 text-warning-500" />
                    )}
                  </div>
                </div>
                {totalWeight !== 100 && (
                  <p className="text-sm text-slate-600 mt-2">
                    {totalWeight < 100 
                      ? `Add ${100 - totalWeight}% more to reach 100%` 
                      : `Remove ${totalWeight - 100}% to reach 100%`
                    }
                  </p>
                )}
              </div>

              {/* Save changes button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveSettings}
                  variant="primary"
                  className="px-8"
                  disabled={totalWeight !== 100 || Object.keys(categories).length === 0}
                >
                  <ApperIcon name="Save" size={16} className="mr-2" />
                  Save Category Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings Preview */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-dashed">
          <CardContent className="py-8 text-center">
            <div className="bg-gradient-to-br from-warning-100 to-warning-200 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <ApperIcon name="Settings" className="h-8 w-8 text-warning-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">More Settings Coming Soon</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Additional configuration options like grading scales, notification preferences, 
              and export settings will be available in future updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default SettingsPage;