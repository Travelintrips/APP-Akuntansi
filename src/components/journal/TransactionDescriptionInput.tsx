import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface TransactionDescriptionInputProps {
  form: any;
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const TransactionDescriptionInput = ({
  form,
  name = "description",
  label = "Deskripsi",
  placeholder = "Masukkan Deskripsi Transaksi",
  required = true,
}: TransactionDescriptionInputProps) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              className="w-full bg-background"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TransactionDescriptionInput;
