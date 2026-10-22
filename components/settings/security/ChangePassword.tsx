"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loadingState";
import { useToast } from "@/hooks/use-toast";
import {
  changePasswordSchema,
  setPasswordSchema,
} from "@/schema/changePasswordSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type FormValues = {
  current_password?: string;
  new_password: string;
  repeat_password: string;
};

export const ChangePassword = ({ hasPassword }: { hasPassword: boolean }) => {
  const t = useTranslations("SETTINGS.SECURITY.FORM");
  const form = useForm<FormValues>({
    resolver: zodResolver(hasPassword ? changePasswordSchema : setPasswordSchema) as any,
    defaultValues: {
      current_password: "",
      new_password: "",
      repeat_password: "",
    },
  });

  const m = useTranslations("MESSAGES");
  const { toast } = useToast();
  const router = useRouter();

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: async (formData: FormValues) => {
      const { data } = await axios.post(
        "/api/profile/change_password",
        formData
      );

      return data;
    },
    onError: (err: AxiosError) => {
      const error = err?.response?.data ? err.response.data : "ERRORS.DEFAULT";

      toast({
        title: m(error),
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      toast({
        title: m("SUCCESS.CHANGED_PASSWORD"),
      });
      router.refresh();
      form.reset();
    },
    mutationKey: ["changePassword"],
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => changePassword(data))}
        className="space-y-6 p-0 sm:p-0 w-full max-w-md"
      >
        <div className="space-y-2 sm:space-y-4 w-full">
          {hasPassword && (
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-muted-foreground text-xs uppercase">
                    {t("CURRENT.LABEL")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-muted"
                      placeholder={t("CURRENT.PLACEHOLDER")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-muted-foreground text-xs uppercase">
                  {t("NEW.LABEL")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="bg-muted"
                    placeholder={t("NEW.PLACEHOLDER")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="repeat_password"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-muted-foreground text-xs uppercase">
                  {t("REPEAT.LABEL")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="bg-muted"
                    placeholder={t("REPEAT.PLACEHOLDER")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button disabled={isPending} className="text-white">
          {isPending ? (
            <LoadingState
              loadingText={t(hasPassword ? "BTN_PENDING" : "BTN_SET_PENDING")}
            />
          ) : (
            t(hasPassword ? "BTN" : "BTN_SET")
          )}
        </Button>
      </form>
    </Form>
  );
};
