"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function FormExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    country: '',
    newsletter: false,
    contactMethod: 'email',
    notifications: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      message: '',
      country: '',
      newsletter: false,
      contactMethod: 'email',
      notifications: false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input 
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name" 
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email" 
        />
      </div>
      
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea 
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Type your message here" 
        />
      </div>
      
      <div>
        <Label htmlFor="country">Country</Label>
        <Select 
          value={formData.country}
          onValueChange={(value) => handleSelectChange('country', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="au">Australia</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="newsletter"
          checked={formData.newsletter}
          onCheckedChange={(checked) => 
            handleCheckboxChange('newsletter', checked === true)
          }
        />
        <Label htmlFor="newsletter">Subscribe to newsletter</Label>
      </div>
      
      <div>
        <Label>Contact Method</Label>
        <RadioGroup 
          value={formData.contactMethod}
          onValueChange={(value) => handleSelectChange('contactMethod', value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email" id="email" />
            <Label htmlFor="email">Email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="phone" id="phone" />
            <Label htmlFor="phone">Phone</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications">Notifications</Label>
        <Switch 
          id="notifications"
          checked={formData.notifications}
          onCheckedChange={(checked) => 
            handleCheckboxChange('notifications', checked)
          }
        />
      </div>
      
      <div className="flex space-x-4">
        <Button type="submit">Submit</Button>
        <Button type="button" variant="outline" onClick={resetForm}>
          Reset
        </Button>
      </div>
    </form>
  );
} 